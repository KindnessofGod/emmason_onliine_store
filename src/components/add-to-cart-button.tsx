"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";
import { CartIcon, CheckIcon, MinusIcon, PlusIcon } from "./icons";

export function AddToCartButton({
  productId,
  stock,
  labels,
  size = "md",
  className = "",
}: {
  productId: string;
  stock: number;
  labels: { add: string; added: string; outOfStock: string };
  size?: "sm" | "md";
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className={`w-full cursor-not-allowed rounded-xl bg-ink-100 px-4 font-bold text-ink-400 ${
          size === "sm" ? "py-2 text-sm" : "py-3"
        } ${className}`}
      >
        {labels.outOfStock}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(productId);
        setJustAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setJustAdded(false), 1800);
      }}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 font-bold text-white transition ${
        justAdded ? "bg-brand-700" : "bg-brand-600 hover:bg-brand-700"
      } ${size === "sm" ? "py-2 text-sm" : "py-3"} ${className}`}
    >
      {justAdded ? (
        <>
          <CheckIcon className="h-[18px] w-[18px]" />
          {labels.added}
        </>
      ) : (
        <>
          <CartIcon className="h-[18px] w-[18px]" />
          {labels.add}
        </>
      )}
    </button>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-ink-200">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={`${label} −`}
        className="rounded-l-lg p-2 text-ink-600 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value}
        min={1}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(1, next)));
        }}
        className="w-11 border-x border-ink-200 py-2 text-center text-sm font-bold text-ink-900 outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`${label} +`}
        className="rounded-r-lg p-2 text-ink-600 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
