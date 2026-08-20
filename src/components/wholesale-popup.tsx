"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { CloseIcon, GlobeIcon, TruckIcon } from "./icons";
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
 *
 * The header band leads with the "5%" as a large stat rather than burying it
 * in a sentence, and two reach bullets (nationwide, pan-African) answer the
 * "is this worth my WhatsApp number" question before the form even loads —
 * the shop owner asked for the popup to read as more enticing, and a big
 * number plus concrete proof of reach does more work than a bigger button.
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
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl">
        <button
          type="button"
          onClick={close}
          aria-label={dict.nav.close}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="rounded-t-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 pb-6 pt-6 text-white sm:rounded-t-2xl">
          <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {dict.wholesale.eyebrow}
          </p>
          <div className="mt-4 flex items-end gap-2.5">
            <span className="text-6xl font-extrabold leading-none tracking-tight">5%</span>
            <span className="mb-1.5 max-w-[7rem] text-xs font-bold uppercase leading-tight text-brand-100">
              {dict.wholesale.popupBadgeSub}
            </span>
          </div>
          <h2 className="mt-4 pr-6 text-xl font-extrabold leading-snug tracking-tight">
            {dict.wholesale.popupTitle}
          </h2>
        </div>

        <div className="p-6">
          <p className="text-sm leading-relaxed text-ink-600">{dict.wholesale.popupBody}</p>

          <ul className="mt-4 space-y-2">
            <li className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <TruckIcon className="h-4 w-4" />
              </span>
              {dict.wholesale.reachNigeria}
            </li>
            <li className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <GlobeIcon className="h-4 w-4" />
              </span>
              {dict.wholesale.reachAfrica}
            </li>
          </ul>

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
      </div>
    </div>,
    document.body,
  );
}
