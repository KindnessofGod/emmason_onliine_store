import "server-only";

import { Resend } from "resend";
import { formatNaira } from "@/lib/money";
import type { OrderWithItems } from "@/lib/db-types";

/**
 * Resend's shared onboarding domain. Swap for a verified Emmason address
 * (and update this constant) once one exists — see the comment on
 * `ORDER_ALERT_EMAIL` in .env.example.
 */
const FROM_ADDRESS = "Emmason Orders <onboarding@resend.dev>";

/**
 * Email the shop owner the moment an order is placed, so they know to fulfil
 * it without checking the dashboard. Fires for every successfully-created
 * order regardless of payment method — callers must treat this as
 * best-effort and never let it fail or roll back checkout.
 */
export async function sendOrderAlertEmail(order: OrderWithItems): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_ALERT_EMAIL;

  if (!apiKey || !to) {
    throw new Error(
      "Order alert email not sent: RESEND_API_KEY or ORDER_ALERT_EMAIL is not configured",
    );
  }

  const itemLines = order.items
    .map(
      (item) =>
        `${item.quantity} x ${item.name_snapshot} — ${formatNaira(item.line_total_kobo)}`,
    )
    .join("\n");

  const text = [
    `New order ${order.reference}`,
    "",
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    "",
    "Items:",
    itemLines,
    "",
    `Total: ${formatNaira(order.total_kobo)}`,
  ].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `New order ${order.reference} — ${formatNaira(order.total_kobo)}`,
    text,
  });

  if (error) throw new Error(error.message);
}
