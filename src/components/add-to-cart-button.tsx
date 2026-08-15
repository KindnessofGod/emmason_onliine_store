"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  /** Smaller styling for product grid cards. */
  compact?: boolean;
}

export function AddToCartButton({
  productId,
  quantity = 1,
  disabled,
  className = "",
  compact,
}: AddToCartButtonProps) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    add(productId, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        compact ? "px-3 py-1.5 text-xs" : "px-5 py-3 text-sm"
      } ${
        justAdded
          ? "bg-brand-600 text-white"
          : "bg-accent-500 text-brand-900 hover:bg-accent-400"
      } ${className}`}
    >
      {justAdded ? (
        <>
          <Check className={compact ? "size-3.5" : "size-4"} aria-hidden />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className={compact ? "size-3.5" : "size-4"} aria-hidden />
          {disabled ? "Out of stock" : "Add to cart"}
        </>
      )}
    </button>
  );
}
