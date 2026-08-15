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
    // Normalise to 234XXXXXXXXXX so WhatsApp links always work.
    return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  });

const checkoutSchema = z
  .object({
    fulfilment: z.enum(["pickup", "delivery"]),
    payment: z.enum(["on-delivery", "transfer", "card"]),
    fullName: z.string().trim().min(2, "Please enter your full name").max(120),
    phone: phoneSchema,
    email: z.string().trim().email("Enter a valid email address").max(160).optional().or(z.literal("")),
    street: z.string().trim().max(400).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    state: z.string().trim().max(60).optional().or(z.literal("")),
    landmark: z.string().trim().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    items: z
      .array(z.object({ productId: z.uuid(), quantity: z.int().min(1).max(99) }))
      .min(1, "Your cart is empty"),
  })
  .refine(
    (data) => data.fulfilment === "pickup" || (data.street && data.city && data.state),
    { message: "A delivery address, town and state are required", path: ["street"] },
  )
  // Card payment goes through Paystack, which sends the receipt by email.
  .refine((data) => data.payment !== "card" || Boolean(data.email), {
    message: "An email address is required for card payment",
    path: ["email"],
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; kind: "paystack"; reference: string; redirectUrl: string }
  | { ok: true; kind: "whatsapp"; reference: string; whatsappUrl: string }
  | { ok: true; kind: "manual"; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Place an order.
 *
 * Card payments open a Paystack transaction and hand back the hosted checkout
 * URL. Transfer and pay-on-delivery are settled by hand, so the order is
 * recorded and the customer is handed a WhatsApp message that already contains
 * everything Emmason needs to fulfil it.
 */
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
  const isCard = data.payment === "card";

  // The delivery note carries the landmark, which has no column of its own.
  const notes = [data.notes, data.landmark && `Landmark: ${data.landmark}`]
    .filter(Boolean)
    .join(" — ");

  let placed;
  try {
    placed = await placeOrder({
      channel: isCard ? "paystack" : "whatsapp",
      fulfilment: data.fulfilment,
      paymentMethod: data.payment,
      customerName: data.fullName,
      customerPhone: data.phone,
      customerEmail: data.email || null,
      deliveryAddress: data.fulfilment === "pickup" ? null : data.street || null,
      deliveryState: data.fulfilment === "pickup" ? null : data.state || null,
      deliveryCity: data.city || null,
      notes: notes || null,
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

  if (isCard) {
    try {
      const transaction = await initializeTransaction({
        email: data.email!,
        amountKobo: placed.totalKobo,
        reference: placed.reference,
        callbackUrl: `${storeConfig.siteUrl}/order/${placed.reference}`,
        metadata: {
          order_id: placed.orderId,
          customer_name: data.fullName,
          customer_phone: data.phone,
        },
      });

      await attachPaystackReference(placed.orderId, transaction.reference);

      return {
        ok: true,
        kind: "paystack",
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

  // Manual settlement: hand back a pre-filled WhatsApp message.
  const order = await getOrderByReference(placed.reference);
  if (!order) {
    return { ok: true, kind: "manual", reference: placed.reference };
  }

  return {
    ok: true,
    kind: "whatsapp",
    reference: placed.reference,
    whatsappUrl: whatsAppLink(
      buildOrderMessage({
        reference: order.reference,
        customerName: order.customer_name,
        fulfilment: order.fulfilment,
        paymentMethod: order.payment_method,
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
