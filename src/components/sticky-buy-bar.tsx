"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";
import { CartIcon, CheckIcon, WhatsAppIcon } from "./icons";

/**
 * Bottom-docked buy bar for phones.
 *
 * Most of Emmason's traffic arrives from a TikTok link on a phone, reads the
 * description, and by then the real Add to cart button has scrolled far above
 * the fold. This keeps the price and the action within thumb reach the whole
 * way down the page, and gets out of the way while the real button is still
 * visible so the two never compete.
 *
 * Hidden from `lg` up, where the buy column is sticky anyway.
 */
export function StickyBuyBar({
  productId,
  stock,
  price,
  whatsappHref,
  labels,
}: {
  productId: string;
  stock: number;
  price: string;
  whatsappHref: string;
  labels: { add: string; added: string; outOfStock: string; ask: string };
}) {
  const { add } = useCart();
  const [visible, setVisible] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const anchor = document.getElementById("buy-box");
    if (!anchor) return;

    // Show the bar only once the real buy box has left the screen.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (stock <= 0) return null;

  function addToCart() {
    add(productId, 1);
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="shrink-0 text-lg font-extrabold tracking-tight text-ink-900">
          {price}
        </span>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.ask}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-brand-600 text-brand-700"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>

        <button
          type="button"
          onClick={addToCart}
          tabIndex={visible ? 0 : -1}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-bold text-white transition ${
            justAdded ? "bg-brand-700" : "bg-brand-600"
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
      </div>
    </div>
  );
}
