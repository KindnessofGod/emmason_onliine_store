"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus, SlidersHorizontal } from "lucide-react";
import { logAdjustment, logRestock } from "@/actions/admin";
import { formatNaira } from "@/lib/money";
import { stockMovementLabel } from "@/lib/stock-movement";
import type { StockMovementRow } from "@/lib/db-types";

type Mode = "restock" | "adjustment";

/**
 * A product's Stock Movement history (newest first) plus a form to log a new
 * Restock or Adjustment. Both go through the log_stock_movement RPC, which
 * updates products.stock and inserts the movement row atomically — see
 * supabase/migrations/0011_stock_movements.sql.
 */
export function StockMovementPanel({
  productId,
  movements,
}: {
  productId: string;
  movements: StockMovementRow[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("restock");
  const [quantity, setQuantity] = useState("");
  const [unitCostNaira, setUnitCostNaira] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const qty = Number.parseInt(quantity, 10);
    if (!Number.isFinite(qty)) {
      setError("Enter a quantity");
      return;
    }
    if (mode === "restock" && qty <= 0) {
      setError("Restock quantity must be greater than zero");
      return;
    }
    if (mode === "adjustment" && qty === 0) {
      setError("Enter a non-zero quantity");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "restock"
          ? await logRestock(
              productId,
              qty,
              unitCostNaira ? Number.parseFloat(unitCostNaira) : undefined,
              note || undefined,
            )
          : await logAdjustment(productId, qty, note);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQuantity("");
      setUnitCostNaira("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-ink-200 bg-white">
      <h2 className="border-b border-ink-200 px-5 py-3 font-semibold">Stock Movement</h2>

      <form onSubmit={handleSubmit} className="space-y-3 border-b border-ink-200 px-5 py-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => switchMode("restock")} className={tabClass(mode === "restock")}>
            <PackagePlus className="size-3.5" aria-hidden /> Restock
          </button>
          <button
            type="button"
            onClick={() => switchMode("adjustment")}
            className={tabClass(mode === "adjustment")}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden /> Adjustment
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ink-500" htmlFor="movement-quantity">
              {mode === "restock" ? "Quantity added" : "Quantity change"}
            </label>
            <input
              id="movement-quantity"
              type="number"
              required
              min={mode === "restock" ? 1 : undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={inputClass}
            />
            {mode === "adjustment" && (
              <p className="mt-1 text-xs text-ink-500">
                Positive if a count turned up more stock, negative for damage or loss.
              </p>
            )}
          </div>

          {mode === "restock" && (
            <div>
              <label className="block text-xs font-medium text-ink-500" htmlFor="movement-cost">
                Cost per unit (₦)
              </label>
              <input
                id="movement-cost"
                type="number"
                min={0}
                step="0.01"
                value={unitCostNaira}
                onChange={(event) => setUnitCostNaira(event.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500" htmlFor="movement-note">
            {mode === "restock" ? "Note (optional)" : "Reason"}
          </label>
          <input
            id="movement-note"
            type="text"
            required={mode === "adjustment"}
            minLength={mode === "adjustment" ? 3 : undefined}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={mode === "adjustment" ? "e.g. damaged in transit" : undefined}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Log {mode === "restock" ? "restock" : "adjustment"}
        </button>
      </form>

      {movements.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-500">No Stock Movements logged yet.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-ink-200 overflow-y-auto">
          {movements.map((movement) => (
            <li key={movement.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
              <span>
                <span className="font-medium">{stockMovementLabel(movement.type)}</span>{" "}
                <span className={movement.quantity > 0 ? "text-brand-600" : "text-red-600"}>
                  {movement.quantity > 0 ? "+" : ""}
                  {movement.quantity}
                </span>
                {movement.unit_cost_kobo !== null && (
                  <span className="ml-2 text-xs text-ink-500">
                    @ {formatNaira(movement.unit_cost_kobo)}/unit
                  </span>
                )}
                {movement.note && <span className="block text-xs text-ink-500">{movement.note}</span>}
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-ink-500">
                {new Date(movement.created_at).toLocaleString("en-NG")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function tabClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
    active
      ? "border-brand-500 bg-brand-50 text-brand-700"
      : "border-ink-200 text-ink-500 hover:border-brand-300"
  }`;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
