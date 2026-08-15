"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, GlobeIcon } from "./icons";
import { localeMeta, locales, type Locale } from "@/lib/i18n/config";

/**
 * Swaps the locale segment of the current path so the shopper stays on the same
 * page, and remembers the choice so middleware stops guessing from headers.
 */
/** One year, so a returning shopper lands in the language they picked. */
function rememberLocale(next: Locale): void {
  document.cookie = `emmason_locale=${next}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher({
  locale,
  label,
  tone = "dark",
}: {
  locale: Locale;
  label: string;
  tone?: "dark" | "light";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;

    rememberLocale(next);

    const segments = (pathname || `/${locale}`).split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
    router.refresh();
  }

  const trigger =
    tone === "light"
      ? "text-white/90 hover:text-white hover:bg-white/10"
      : "text-ink-600 hover:text-ink-900 hover:bg-ink-100";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition ${trigger}`}
      >
        <GlobeIcon className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">{localeMeta[locale].native}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lift"
        >
          {locales.map((code) => {
            const meta = localeMeta[code];
            const active = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(code)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                    active ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {meta.flag}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{meta.native}</span>
                    {meta.native !== meta.english && (
                      <span className="block text-xs text-ink-400">{meta.english}</span>
                    )}
                  </span>
                  {active && <span className="text-brand-600">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
