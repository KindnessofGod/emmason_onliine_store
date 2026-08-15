import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getOrderByReference } from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import type { Order } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data: base } = await supabase
    .from("orders")
    .select("reference")
    .eq("id", id)
    .maybeSingle();

  if (!base) notFound();

  const order = await getOrderByReference((base as Pick<Order, "reference">).reference);
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-ink-500 hover:text-brand-600">
        ← Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-tight">
          {order.reference}
        </h1>
        <OrderStatusBadge status={order.status} />
        <span className="text-sm capitalize text-ink-500">
          via {order.channel}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-xl border border-ink-200 bg-white">
            <h2 className="border-b border-ink-200 px-5 py-3 font-semibold">Items</h2>
            <ul className="divide-y divide-ink-200">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <span>
                    <span className="font-medium">{item.quantity} ×</span>{" "}
                    {item.name_snapshot}
                    <span className="ml-2 text-xs text-ink-500">
                      @ {formatNaira(item.unit_price_kobo)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatNaira(item.line_total_kobo)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-ink-200 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd>{formatNaira(order.subtotal_kobo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Delivery</dt>
                <dd>{formatNaira(order.delivery_fee_kobo)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatNaira(order.total_kobo)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-ink-200 bg-white">
            <h2 className="border-b border-ink-200 px-5 py-3 font-semibold">
              Customer &amp; delivery
            </h2>
            <dl className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-2">
              <Detail label="Name" value={order.customer_name} />
              <Detail
                label="Phone"
                value={
                  <a
                    href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-600 hover:underline"
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    {order.customer_phone}
                  </a>
                }
              />
              <Detail label="Email" value={order.customer_email ?? "—"} />
              <Detail label="State" value={order.delivery_state} />
              <div className="sm:col-span-2">
                <Detail
                  label="Address"
                  value={`${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ""}`}
                />
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <Detail label="Notes" value={order.notes} />
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside className="h-fit space-y-6">
          <section className="rounded-xl border border-ink-200 bg-white p-5">
            <h2 className="font-semibold">Update status</h2>
            <p className="mt-1 text-xs text-ink-500">
              Cancelling returns the reserved stock to the shelf.
            </p>
            <OrderStatusControl orderId={order.id} current={order.status} />
          </section>

          <section className="rounded-xl border border-ink-200 bg-white p-5 text-sm">
            <h2 className="font-semibold">Payment</h2>
            <dl className="mt-3 space-y-2">
              <Detail label="Channel" value={order.channel} />
              <Detail
                label="Paystack ref"
                value={order.paystack_reference ?? "—"}
              />
              <Detail
                label="Paid at"
                value={
                  order.paid_at
                    ? new Date(order.paid_at).toLocaleString("en-NG")
                    : "Not paid"
                }
              />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
  );
}
