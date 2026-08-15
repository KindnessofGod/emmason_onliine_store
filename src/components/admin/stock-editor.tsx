"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { adjustStock } from "@/actions/admin";

/** Inline stock field so restocking does not require opening the editor. */
export function StockEditor({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [value, setValue] = useState(stock);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function commit() {
    if (value === stock) return;

    setError(false);
    startTransition(async () => {
      const result = await adjustStock(productId, value);
      if (!result.ok) {
        setError(true);
        setValue(stock);
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        value={value}
        aria-label="Stock level"
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          setValue(Number.isNaN(next) ? 0 : Math.max(next, 0));
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={`w-16 rounded-lg border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
          error ? "border-red-500" : "border-ink-200"
        } ${value === 0 ? "text-red-600" : value <= 5 ? "text-flash-600" : ""}`}
      />
      {pending && <Loader2 className="size-3.5 animate-spin text-ink-500" aria-hidden />}
      {saved && <Check className="size-3.5 text-brand-600" aria-hidden />}
    </span>
  );
}
