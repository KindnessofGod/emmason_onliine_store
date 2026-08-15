import Link from "next/link";
import { AlertTriangle, Package, ShoppingBag, Wallet } from "lucide-react";
import { getDashboardStats } from "@/lib/admin-data";
import { listOrders } from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    listOrders({ limit: 8 }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="size-5" aria-hidden />}
          label="Orders today"
          value={String(stats.ordersToday)}
        />
        <StatCard
          icon={<AlertTriangle className="size-5" aria-hidden />}
          label="Needs attention"
          value={String(stats.ordersAwaiting)}
          hint="Pending or awaiting payment"
        />
        <StatCard
          icon={<Wallet className="size-5" aria-hidden />}
          label="Confirmed revenue"
          value={formatNaira(stats.revenuePaidKobo)}
          hint="Paid orders, all time"
        />
        <StatCard
          icon={<Package className="size-5" aria-hidden />}
          label="Active products"
          value={String(stats.productCount)}
          hint={`${stats.outOfStockCount} out of stock`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border border-ink-200 bg-white">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ink-500">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-brand-50"
                  >
                    <span className="font-mono text-sm font-medium">
                      {order.reference}
                    </span>
                    <span className="text-sm text-ink-500">
                      {order.customer_name}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    <span className="ml-auto text-sm font-semibold">
                      {formatNaira(order.total_kobo)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-xl border border-ink-200 bg-white">
          <div className="border-b border-ink-200 px-5 py-3">
            <h2 className="font-semibold">Running low</h2>
          </div>

          {stats.lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              Nothing is running low.
            </p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {stats.lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  <span className="shrink-0 rounded-full bg-flash-500/10 px-2 py-0.5 text-xs font-semibold text-flash-600">
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
