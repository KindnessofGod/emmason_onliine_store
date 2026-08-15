import { formatNaira } from "@/lib/money";
import { storeConfig } from "@/lib/store-config";
import type { OrderItem } from "@/lib/types";

interface WhatsAppOrderMessage {
  reference: string;
  customerName: string;
  deliveryAddress: string;
  deliveryState: string;
  deliveryCity?: string | null;
  items: Pick<OrderItem, "name_snapshot" | "quantity" | "line_total_kobo">[];
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  notes?: string | null;
}

/**
 * Build the message the customer sends us on WhatsApp. The order already
 * exists in the database by this point — this is the human-readable copy so
 * the conversation starts with everything already stated.
 */
export function buildOrderMessage(order: WhatsAppOrderMessage): string {
  const lines = [
    `*New order ${order.reference}*`,
    "",
    `*Name:* ${order.customerName}`,
    `*Deliver to:* ${order.deliveryAddress}${order.deliveryCity ? `, ${order.deliveryCity}` : ""}, ${order.deliveryState}`,
    "",
    "*Items*",
  ];

  for (const item of order.items) {
    lines.push(
      `• ${item.quantity} x ${item.name_snapshot} — ${formatNaira(item.line_total_kobo)}`,
    );
  }

  lines.push(
    "",
    `Subtotal: ${formatNaira(order.subtotalKobo)}`,
    `Delivery: ${formatNaira(order.deliveryFeeKobo)}`,
    `*Total: ${formatNaira(order.totalKobo)}*`,
  );

  if (order.notes) {
    lines.push("", `*Note:* ${order.notes}`);
  }

  lines.push("", "Please confirm availability and payment details. Thank you.");

  return lines.join("\n");
}

/** wa.me deep link with the message pre-filled. */
export function whatsAppLink(message: string, number = storeConfig.whatsappNumber): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/** Generic "chat to us" link used in the header and footer. */
export function whatsAppEnquiryLink(about?: string): string {
  const message = about
    ? `Hello ${storeConfig.name}, I would like to ask about: ${about}`
    : `Hello ${storeConfig.name}, I would like to make an enquiry.`;
  return whatsAppLink(message);
}
