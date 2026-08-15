"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { itemCount, ready } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
    >
      <ShoppingCart className="size-5" aria-hidden />
      <span className="hidden sm:inline">Cart</span>
      {ready && itemCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-brand-900"
          aria-label={`${itemCount} items in cart`}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
