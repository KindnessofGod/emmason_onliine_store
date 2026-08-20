"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { CloseIcon } from "./icons";
import { WholesaleForm } from "./wholesale-form";
import type { Dictionary, Locale } from "@/lib/i18n";

const STORAGE_KEY = "emmason_wholesale_popup_seen";
const SHOW_DELAY_MS = 4000;
// Mid-checkout is the wrong moment to interrupt with an offer, and /sell
// already carries this exact form inline — showing the popup on top of it
// would be redundant.
const SUPPRESSED_SEGMENTS = ["/cart", "/checkout", "/sell"];

/**
 * Homepage-and-beyond lead-gen popup: 5% off a first wholesale order for a
 * name and a WhatsApp number. Portalled to document.body for the same
 * reason the mobile nav drawer is — it must not end up nested under the
 * header's `backdrop-blur`, which would clip a `fixed` descendant to the
 * header's own box instead of the viewport.
 */
export function WholesalePopup({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // Storage unavailable (private browsing, disabled) — fail closed.
      return;
    }
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to fall back to — worst case it can show again next visit.
    }
  }

  function close() {
    setOpen(false);
    markSeen();
  }

  if (!open) return null;
  if (SUPPRESSED_SEGMENTS.some((segment) => pathname?.includes(segment))) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={dict.nav.close}
        onClick={close}
        className="absolute inset-0 bg-ink-900/60"
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-lift sm:rounded-2xl">
        <button
          type="button"
          onClick={close}
          aria-label={dict.nav.close}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <p className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
          {dict.wholesale.eyebrow}
        </p>
        <h2 className="mt-3 pr-6 text-2xl font-extrabold tracking-tight text-ink-900">
          {dict.wholesale.popupTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{dict.wholesale.popupBody}</p>

        <div className="mt-5">
          <WholesaleForm locale={locale} dict={dict} source="popup" onSuccess={markSeen} />
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-3 w-full text-center text-xs font-semibold text-ink-400 transition hover:text-ink-600"
        >
          {dict.wholesale.popupDismiss}
        </button>
      </div>
    </div>,
    document.body,
  );
}
