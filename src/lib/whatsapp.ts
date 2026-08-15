import { formatNaira } from "@/lib/money";
import { site } from "@/lib/site";
import type { FulfilmentMethod, OrderItem, PaymentMethodDb } from "@/lib/db-types";

/** Digits-only international form of the shop's WhatsApp line. */
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "2349065755314";

const PAYMENT_LABEL: Record<PaymentMethodDb, string> = {
  "on-delivery": "Pay on delivery",
  transfer: "Bank transfer",
  card: "Card (Paystack)",
};

interface WhatsAppOrderMessage {
  reference: string;
  customerName: string;
  fulfilment: FulfilmentMethod;
  paymentMethod: PaymentMethodDb;
  deliveryAddress?: string | null;
  deliveryState?: string | null;
  deliveryCity?: string | null;
  items: Pick<OrderItem, "name_snapshot" | "quantity" | "line_total_kobo">[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  notes?: string | null;
}

/**
 * The message the customer sends to the shop. The order already exists in the
 * database by this point — this is the readable copy, so the conversation
 * opens with everything already stated instead of twenty questions.
 */
export function buildOrderMessage(order: WhatsAppOrderMessage): string {
  const lines = [
    `*New order ${order.reference}*`,
    "",
    `*Name:* ${order.customerName}`,
    `*Payment:* ${PAYMENT_LABEL[order.paymentMethod]}`,
  ];

  if (order.fulfilment === "pickup") {
    lines.push(
      `*Collection:* Store pickup — ${site.address.line1}, ${site.address.city}`,
    );
  } else {
    const where = [order.deliveryAddress, order.deliveryCity, order.deliveryState]
      .filter(Boolean)
      .join(", ");
    lines.push(`*Deliver to:* ${where}`);
  }

  lines.push("", "*Items*");

  for (const item of order.items) {
    lines.push(
      `• ${item.quantity} x ${item.name_snapshot} — ${formatNaira(item.line_total_kobo)}`,
    );
  }

  lines.push(
    "",
    `Subtotal: ${formatNaira(order.subtotalKobo)}`,
    order.fulfilment === "pickup"
      ? "Delivery: store pickup (free)"
      : `Delivery: ${formatNaira(order.deliveryFeeKobo)}`,
    `*Total: ${formatNaira(order.totalKobo)}*`,
  );

  if (order.notes) lines.push("", `*Note:* ${order.notes}`);

  lines.push("", "Please confirm availability and payment details. Thank you.");

  return lines.join("\n");
}

/** wa.me deep link with the message pre-filled. */
export function whatsAppLink(message: string, number = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Generic "chat to us" link used in the header and footer. */
export function whatsAppEnquiryLink(about?: string): string {
  const message = about
    ? `Hello ${site.name}, I would like to ask about: ${about}`
    : `Hello ${site.name}, I would like to make an enquiry.`;
  return whatsAppLink(message);
}
