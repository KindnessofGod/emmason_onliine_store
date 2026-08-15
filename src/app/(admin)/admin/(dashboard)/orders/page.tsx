import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Packing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = FILTERS.some((filter) => filter.value === status) ? status! : "all";
  const orders = await listOrders({ status: active });

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/orders?status=${filter.value}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active === filter.value
                ? "bg-brand-600 text-white"
                : "border border-ink-200 hover:border-brand-400"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-ink-200 bg-white">
        {orders.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-ink-500">
            No orders with this status.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-brand-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-medium text-brand-600 hover:underline"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-ink-500">
                        {order.customer_phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {order.delivery_state}
                    </td>
                    <td className="px-4 py-3 capitalize text-ink-500">
                      {order.channel}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNaira(order.total_kobo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {new Date(order.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
