"use server";

import { z } from "zod";
import { initializeTransaction } from "@/lib/paystack";
import {
  attachPaystackReference,
  cancelOrder,
  getOrderByReference,
  placeOrder,
} from "@/lib/orders";
import { storeConfig } from "@/lib/store-config";
import { buildOrderMessage, whatsAppLink } from "@/lib/whatsapp";

/**
 * Nigerian mobile numbers, accepting the three ways people actually type them:
 * 08012345678, 2348012345678, +2348012345678.
 */
const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine(
    (value) => /^(0\d{10}|\+?234\d{10})$/.test(value),
    "Enter a valid Nigerian phone number, e.g. 0801 234 5678",
  )
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    // Normalise everything to 234XXXXXXXXXX so WhatsApp links always work.
    return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  });

const checkoutSchema = z.object({
  channel: z.enum(["paystack", "whatsapp"]),
  customerName: z.string().trim().min(2, "Please enter your full name").max(120),
  customerPhone: phoneSchema,
  customerEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(160)
    .optional()
    .or(z.literal("")),
  deliveryAddress: z
    .string()
    .trim()
    .min(10, "Please give a full street address we can find")
    .max(400),
  deliveryState: z.string().trim().min(2).max(60),
  deliveryCity: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; channel: "paystack"; reference: string; redirectUrl: string }
  | { ok: true; channel: "whatsapp"; reference: string; whatsappUrl: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ??
      flat.formErrors[0] ??
      "Please check the form and try again.";
    return { ok: false, error: firstError, fieldErrors: flat.fieldErrors };
  }

  const data = parsed.data;

  // Paystack needs somewhere to send the receipt.
  if (data.channel === "paystack" && !data.customerEmail) {
    return {
      ok: false,
      error: "An email address is required for card payment.",
      fieldErrors: { customerEmail: ["Required for card payment"] },
    };
  }

  let placed;
  try {
    placed = await placeOrder({
      channel: data.channel,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      deliveryAddress: data.deliveryAddress,
      deliveryState: data.deliveryState,
      deliveryCity: data.deliveryCity || null,
      notes: data.notes || null,
      items: data.items,
    });
  } catch (error) {
    // Stock and delivery-area failures are raised as readable messages by the
    // database function, so they are safe to show the customer.
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not place your order.",
    };
  }

  if (data.channel === "whatsapp") {
    const order = await getOrderByReference(placed.reference);
    if (!order) {
      return { ok: false, error: "Order was created but could not be read back." };
    }

    return {
      ok: true,
      channel: "whatsapp",
      reference: placed.reference,
      whatsappUrl: whatsAppLink(
        buildOrderMessage({
          reference: order.reference,
          customerName: order.customer_name,
          deliveryAddress: order.delivery_address,
          deliveryState: order.delivery_state,
          deliveryCity: order.delivery_city,
          items: order.items,
          subtotalKobo: order.subtotal_kobo,
          deliveryFeeKobo: order.delivery_fee_kobo,
          totalKobo: order.total_kobo,
          notes: order.notes,
        }),
      ),
    };
  }

  // Card payment: open a Paystack transaction and hand back the hosted URL.
  try {
    const transaction = await initializeTransaction({
      email: data.customerEmail!,
      amountKobo: placed.totalKobo,
      reference: placed.reference,
      callbackUrl: `${storeConfig.siteUrl}/order/${placed.reference}`,
      metadata: {
        order_id: placed.orderId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
      },
    });

    await attachPaystackReference(placed.orderId, transaction.reference);

    return {
      ok: true,
      channel: "paystack",
      reference: placed.reference,
      redirectUrl: transaction.authorizationUrl,
    };
  } catch (error) {
    // Payment could not be started, so release the stock we just reserved
    // rather than leaving it held by an order that will never be paid.
    await cancelOrder(placed.orderId, "Paystack initialisation failed").catch(() => {});

    return {
      ok: false,
      error:
        error instanceof Error
          ? `Could not start payment: ${error.message}`
          : "Could not start payment.",
    };
  }
}
