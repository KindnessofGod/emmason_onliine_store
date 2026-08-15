import type { OrderStatus } from "@/lib/db-types";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-slate-200 text-slate-800",
  },
  awaiting_payment: {
    label: "Awaiting payment",
    className: "bg-amber-200 text-amber-900",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-200 text-emerald-900",
  },
  processing: {
    label: "Packing",
    className: "bg-sky-200 text-sky-900",
  },
  shipped: {
    label: "Shipped",
    className: "bg-indigo-200 text-indigo-900",
  },
  delivered: {
    label: "Delivered",
    className: "bg-brand-200 text-brand-900",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-200 text-red-900",
  },
  refunded: {
    label: "Refunded",
    className: "bg-purple-200 text-purple-900",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}
