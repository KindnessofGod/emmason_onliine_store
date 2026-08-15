"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { hydrateCart, type HydratedCart } from "@/actions/cart";
import { formatNaira } from "@/lib/money";
import { ProductImage } from "@/components/product-image";

const EMPTY: HydratedCart = {
  lines: [],
  subtotalKobo: 0,
  removedCount: 0,
  adjusted: [],
};

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();
  const [priced, setPriced] = useState<HydratedCart | null>(null);

  // Re-price from the server on every change: stock and prices may have moved
  // since the item was added.
  useEffect(() => {
    if (!ready || lines.length === 0) return;

    let cancelled = false;
    void hydrateCart(lines).then((result) => {
      if (!cancelled) setPriced(result);
    });

    return () => {
      cancelled = true;
    };
  }, [lines, ready]);

  const isEmpty = ready && lines.length === 0;
  const cart = isEmpty ? EMPTY : priced;
  const loading = !ready || cart === null;

  if (loading) {
    return (
      <div className="mt-8 space-y-3" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <p className="font-medium">Your cart is empty.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the categories and add something you like.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-accent-400"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-3">
        {(cart.removedCount > 0 || cart.adjusted.length > 0) && (
          <div className="flex gap-3 rounded-xl border border-accent-400 bg-accent-400/10 p-4 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-accent-600" aria-hidden />
            <div>
              {cart.removedCount > 0 && (
                <p>
                  {cart.removedCount}{" "}
                  {cart.removedCount === 1 ? "item is" : "items are"} no longer
                  available and {cart.removedCount === 1 ? "was" : "were"} removed.
                </p>
              )}
              {cart.adjusted.map((item) => (
                <p key={item.name}>
                  Only {item.available} of {item.name} left — quantity reduced from{" "}
                  {item.requested}.
                </p>
              ))}
            </div>
          </div>
        )}

        {cart.lines.map((line) => (
          <div
            key={line.productId}
            className="flex gap-4 rounded-xl border border-border bg-card p-3"
          >
            <Link
              href={`/product/${line.product.slug}`}
              className="size-24 shrink-0 overflow-hidden rounded-lg"
            >
              <ProductImage images={line.product.images} name={line.product.name} />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/product/${line.product.slug}`}
                className="line-clamp-2 text-sm font-medium hover:text-brand-600"
              >
                {line.product.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatNaira(line.product.price_kobo)} each
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    aria-label={`Decrease quantity of ${line.product.name}`}
                    className="p-2 transition hover:bg-brand-50 dark:hover:bg-brand-900"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="w-9 text-center text-sm font-medium">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    disabled={line.quantity >= line.product.stock}
                    aria-label={`Increase quantity of ${line.product.name}`}
                    className="p-2 transition hover:bg-brand-50 disabled:opacity-30 dark:hover:bg-brand-900"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-red-600"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </button>
              </div>
            </div>

            <p className="shrink-0 text-sm font-bold text-brand-700 dark:text-brand-300">
              {formatNaira(line.lineTotalKobo)}
            </p>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-32">
        <h2 className="font-semibold">Order summary</h2>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatNaira(cart.subtotalKobo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-muted-foreground">Calculated at checkout</span>
          </div>
        </div>

        <Link
          href="/checkout"
          className="mt-5 block rounded-lg bg-accent-500 px-6 py-3 text-center text-sm font-semibold text-brand-900 transition hover:bg-accent-400"
        >
          Proceed to checkout
        </Link>

        <Link
          href="/"
          className="mt-3 block text-center text-sm text-muted-foreground transition hover:text-brand-600"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
