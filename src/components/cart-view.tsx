"use client";

import Link from "next/link";
import { useMemo } from "react";
import { QuantityStepper } from "./add-to-cart-button";
import { useCart } from "./cart-provider";
import { TrashIcon, TruckIcon } from "./icons";
import { ProductImage } from "./product-image";
import { EmptyState } from "./ui";
import { formatPrice } from "@/lib/format";
import { href, pluralize, type Dictionary, type Locale } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export function CartView({
  locale,
  dict,
  catalogue,
  deliveryFee,
  freeDeliveryThreshold,
}: {
  locale: Locale;
  dict: Dictionary;
  catalogue: Product[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
}) {
  const { lines, ready, setQuantity, remove } = useCart();

  const byId = useMemo(
    () => new Map(catalogue.map((product) => [product.id, product])),
    [catalogue],
  );

  const items = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = byId.get(line.productId);
        return product ? [{ product, quantity: line.quantity }] : [];
      }),
    [lines, byId],
  );

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const qualifiesFree = subtotal >= freeDeliveryThreshold;
  const delivery = items.length === 0 ? 0 : qualifiesFree ? 0 : deliveryFee;

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-card bg-ink-100" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={dict.cart.empty}
        action={
          <Link
            href={href(locale, "/shop")}
            className="inline-block rounded-xl bg-brand-600 px-6 py-3 font-bold text-white transition hover:bg-brand-700"
          >
            {dict.cart.emptyCta}
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-3">
        {items.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="flex gap-4 rounded-card border border-ink-100 bg-white p-4 shadow-soft"
          >
            <Link
              href={href(locale, `/product/${product.slug}`)}
              className="shrink-0 overflow-hidden rounded-xl"
            >
              <ProductImage
                categorySlug={product.categorySlug}
                name={product.name}
                size="thumb"
                className="h-24 w-24"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-bold text-ink-900">
                    <Link
                      href={href(locale, `/product/${product.slug}`)}
                      className="transition hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-500">{product.brand}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  aria-label={`${dict.cart.remove} — ${product.name}`}
                  className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-flash-500/10 hover:text-flash-500"
                >
                  <TrashIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <QuantityStepper
                  value={quantity}
                  max={product.stock}
                  onChange={(next) => setQuantity(product.id, next)}
                  label={dict.product.quantity}
                />
                <span className="text-lg font-extrabold text-ink-900">
                  {formatPrice(product.price * quantity, locale)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.checkout.summary}</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">
                {dict.cart.subtotal}
                <span className="text-ink-400">
                  {" "}
                  ·{" "}
                  {pluralize(items.reduce((n, i) => n + i.quantity, 0), dict.cart.itemsOne, dict.cart.items)}
                </span>
              </dt>
              <dd className="font-bold text-ink-900">{formatPrice(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">{dict.cart.delivery}</dt>
              <dd className="font-bold text-ink-900">
                {delivery === 0 ? dict.cart.deliveryFree : formatPrice(delivery, locale)}
              </dd>
            </div>
          </dl>

          {!qualifiesFree && (
            <p className="mt-4 flex gap-2 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
              <TruckIcon className="h-4 w-4 shrink-0" />
              <span>
                {formatPrice(freeDeliveryThreshold - subtotal, locale)} → {dict.cart.deliveryFree}{" "}
                {dict.cart.delivery.toLowerCase()}
              </span>
            </p>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-ink-100 pt-5">
            <span className="font-bold text-ink-900">{dict.cart.total}</span>
            <span className="text-2xl font-extrabold text-ink-900">
              {formatPrice(subtotal + delivery, locale)}
            </span>
          </div>

          <Link
            href={href(locale, "/checkout")}
            className="mt-6 block rounded-xl bg-brand-600 py-3.5 text-center font-bold text-white transition hover:bg-brand-700"
          >
            {dict.cart.checkout}
          </Link>
          <Link
            href={href(locale, "/shop")}
            className="mt-3 block py-2 text-center text-sm font-semibold text-ink-600 transition hover:text-brand-700"
          >
            {dict.cart.continueShopping}
          </Link>
        </div>
      </aside>
    </div>
  );
}
