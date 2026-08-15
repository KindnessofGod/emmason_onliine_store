"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  stock: number;
}

export function ProductPurchasePanel({ productId, stock }: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const soldOut = stock === 0;

  function step(delta: number) {
    setQuantity((current) => Math.min(Math.max(current + delta, 1), Math.max(stock, 1)));
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={soldOut || quantity <= 1}
          aria-label="Decrease quantity"
          className="p-3 transition hover:bg-brand-50 disabled:opacity-30 dark:hover:bg-brand-900"
        >
          <Minus className="size-4" aria-hidden />
        </button>

        <input
          type="number"
          value={quantity}
          min={1}
          max={Math.max(stock, 1)}
          aria-label="Quantity"
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isNaN(next)) return;
            setQuantity(Math.min(Math.max(next, 1), Math.max(stock, 1)));
          }}
          className="w-14 border-0 bg-transparent text-center text-sm font-medium focus:outline-none"
        />

        <button
          type="button"
          onClick={() => step(1)}
          disabled={soldOut || quantity >= stock}
          aria-label="Increase quantity"
          className="p-3 transition hover:bg-brand-50 disabled:opacity-30 dark:hover:bg-brand-900"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <AddToCartButton productId={productId} quantity={quantity} disabled={soldOut} />

      <Link
        href="/cart"
        className="rounded-lg border border-brand-600 px-5 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-900"
      >
        View cart
      </Link>
    </div>
  );
}
