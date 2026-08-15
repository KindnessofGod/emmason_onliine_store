"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QuantityStepper } from "./add-to-cart-button";
import { useCart } from "./cart-provider";
import { CartIcon, CheckIcon } from "./icons";

/**
 * Quantity + add/buy on the product page. Kept separate from the card button
 * because this one owns a quantity and can push straight to the cart.
 */
export function ProductBuyBox({
  productId,
  stock,
  labels,
  cartHref,
}: {
  productId: string;
  stock: number;
  labels: {
    add: string;
    added: string;
    outOfStock: string;
    quantity: string;
    buyNow: string;
  };
  cartHref: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
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
        className="mt-7 w-full cursor-not-allowed rounded-xl bg-ink-100 py-3.5 font-bold text-ink-400"
      >
        {labels.outOfStock}
      </button>
    );
  }

  function addToCart() {
    add(productId, quantity);
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        max={stock}
        onChange={setQuantity}
        label={labels.quantity}
      />

      <button
        type="button"
        onClick={addToCart}
        className={`flex min-w-40 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold text-white transition ${
          justAdded ? "bg-brand-700" : "bg-brand-600 hover:bg-brand-700"
        }`}
      >
        {justAdded ? (
          <>
            <CheckIcon className="h-5 w-5" />
            {labels.added}
          </>
        ) : (
          <>
            <CartIcon className="h-5 w-5" />
            {labels.add}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          add(productId, quantity);
          router.push(cartHref);
        }}
        className="min-w-32 flex-1 rounded-xl border-2 border-brand-600 px-5 py-3 font-bold text-brand-700 transition hover:bg-brand-50"
      >
        {labels.buyNow}
      </button>
    </div>
  );
}
