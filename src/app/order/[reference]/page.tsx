import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MessageCircle, XCircle } from "lucide-react";
import { getOrderByReference, markOrderPaid } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";
import { formatNaira } from "@/lib/money";
import { formatWhatsAppNumber } from "@/lib/store-config";
import { whatsAppEnquiryLink } from "@/lib/whatsapp";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your order" };

const STATUS_COPY: Record<OrderStatus, { label: string; body: string; tone: "good" | "wait" | "bad" }> = {
  pending: {
    label: "Order received",
    body: "We have your order. Send us the WhatsApp message to confirm it, and we will reply with payment details.",
    tone: "wait",
  },
  awaiting_payment: {
    label: "Awaiting payment",
    body: "Your order is held for you. It is confirmed as soon as payment comes through.",
    tone: "wait",
  },
  paid: {
    label: "Payment confirmed",
    body: "Thank you. We are packing your order and will be in touch about delivery.",
    tone: "good",
  },
  processing: {
    label: "Being packed",
    body: "Your items are being packed for dispatch.",
    tone: "good",
  },
  shipped: {
    label: "On the way",
    body: "Your order has left us. The dispatch rider will call the number you gave.",
    tone: "good",
  },
  delivered: {
    label: "Delivered",
    body: "This order has been delivered. Enjoy — and tell a friend.",
    tone: "good",
  },
  cancelled: {
    label: "Cancelled",
    body: "This order was cancelled and nothing has been charged.",
    tone: "bad",
  },
  refunded: {
    label: "Refunded",
    body: "This order was refunded. Allow a few working days for it to reach your bank.",
    tone: "bad",
  },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  let order = await getOrderByReference(reference);
  if (!order) notFound();

  // Paystack redirects here after checkout. Verify server-side rather than
  // trusting the redirect — the webhook may not have landed yet.
  if (order.channel === "paystack" && order.status === "awaiting_payment") {
    try {
      const verified = await verifyTransaction(order.paystack_reference ?? reference);
      if (verified.status === "success" && verified.amountKobo >= order.total_kobo) {
        await markOrderPaid(order.paystack_reference ?? reference, verified.paidAt);
        order = (await getOrderByReference(reference)) ?? order;
      }
    } catch {
      // Verification is best-effort here; the webhook is the reliable path and
      // will settle the order shortly.
    }
  }

  const status = STATUS_COPY[order.status];
  const Icon =
    status.tone === "good" ? CheckCircle2 : status.tone === "bad" ? XCircle : Clock;

  const toneClasses =
    status.tone === "good"
      ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-100"
      : status.tone === "bad"
        ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
        : "border-accent-400 bg-accent-400/10 text-accent-600";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className={`flex gap-4 rounded-xl border p-5 ${toneClasses}`}>
        <Icon className="size-7 shrink-0" aria-hidden />
        <div>
          <h1 className="text-lg font-bold">{status.label}</h1>
          <p className="mt-1 text-sm leading-relaxed">{status.body}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Order {order.reference}</h2>
          <p className="text-xs text-muted-foreground">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Quote this reference in any message to us.
        </p>

        <ul className="mt-5 divide-y divide-border border-y border-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="font-medium">{item.quantity} ×</span>{" "}
                {item.name_snapshot}
              </span>
              <span className="shrink-0 font-medium">
                {formatNaira(item.line_total_kobo)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatNaira(order.subtotal_kobo)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Delivery to {order.delivery_state}
            </dt>
            <dd>{formatNaira(order.delivery_fee_kobo)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-brand-700 dark:text-brand-300">
              {formatNaira(order.total_kobo)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-lg bg-background p-4 text-sm">
          <h3 className="font-medium">Delivery address</h3>
          <p className="mt-1 text-muted-foreground">
            {order.customer_name}
            <br />
            {order.delivery_address}
            {order.delivery_city ? `, ${order.delivery_city}` : ""}
            <br />
            {order.delivery_state}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsAppEnquiryLink(`order ${order.reference}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <MessageCircle className="size-4" aria-hidden />
          Message us about this order
        </a>
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-3 text-sm font-medium transition hover:border-brand-400"
        >
          Continue shopping
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Questions? WhatsApp us on {formatWhatsAppNumber()}.
      </p>
    </div>
  );
}
