import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon, StarIcon } from "./icons";
import type { Condition } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";

export function SectionHeading({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group hidden shrink-0 items-center gap-1 text-sm font-bold text-brand-700 transition hover:text-brand-800 sm:flex"
        >
          {actionLabel}
          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Rating({
  value,
  count,
  className = "",
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon
            key={n}
            className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "text-amber-400" : "text-ink-200"}`}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-ink-600">
        {value.toFixed(1)}
        {typeof count === "number" && (
          <span className="font-normal text-ink-400"> ({count})</span>
        )}
      </span>
    </span>
  );
}

export function SaleBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-flash-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
      {label}
    </span>
  );
}

export function ConditionBadge({
  condition,
  dict,
}: {
  condition: Condition;
  dict: Dictionary;
}) {
  const label =
    condition === "new"
      ? dict.product.conditionNew
      : condition === "uk-used"
        ? dict.product.conditionUkUsed
        : dict.product.conditionRefurbished;

  const tone =
    condition === "new"
      ? "bg-brand-100 text-brand-800"
      : condition === "uk-used"
        ? "bg-sky-100 text-sky-800"
        : "bg-amber-100 text-amber-800";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>{label}</span>
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
      <svg viewBox="0 0 20 20" className="h-3 w-3 fill-brand-600" aria-hidden="true">
        <path d="M10 1.5 12.2 4l3.3-.3.5 3.3 2.7 1.9-1.6 2.9 1.6 2.9-2.7 1.9-.5 3.3-3.3-.3L10 21.5 7.8 19l-3.3.3-.5-3.3L1.3 14l1.6-2.9-1.6-2.9L4 6.3l.5-3.3L7.8 3.3z" />
        <path d="m8.7 13.4-2.4-2.4 1.1-1.1 1.3 1.3 3.4-3.4 1.1 1.1z" className="fill-white" />
      </svg>
      {label}
    </span>
  );
}

export function TrustPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        {icon}
      </span>
      <span className="font-semibold text-ink-700">{label}</span>
    </li>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href ? (
              <Link href={item.href} className="transition hover:text-brand-700">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-ink-700">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRightIcon className="h-3 w-3 text-ink-300" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-ink-200 bg-ink-50 px-6 py-16 text-center">
      <p className="text-lg font-bold text-ink-800">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
