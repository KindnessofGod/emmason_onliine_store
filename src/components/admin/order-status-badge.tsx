import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  },
  awaiting_payment: {
    label: "Awaiting payment",
    className: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100",
  },
  processing: {
    label: "Packing",
    className: "bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100",
  },
  shipped: {
    label: "Shipped",
    className: "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100",
  },
  delivered: {
    label: "Delivered",
    className: "bg-brand-200 text-brand-900 dark:bg-brand-700 dark:text-brand-50",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100",
  },
  refunded: {
    label: "Refunded",
    className: "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
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
