import type { Locale } from "./i18n/config";

/** Intl tags for the locales we ship. Yoruba/Igbo/Hausa number formatting
 *  follows en-NG conventions, which is what shoppers here expect. */
const intlTag: Record<Locale, string> = {
  en: "en-NG",
  yo: "en-NG",
  ig: "en-NG",
  ha: "en-NG",
  fr: "fr-FR",
};

/** Formats whole Naira: 65000 -> "₦65,000" */
export function formatPrice(amount: number, locale: Locale = "en"): string {
  const digits = new Intl.NumberFormat(intlTag[locale], {
    maximumFractionDigits: 0,
  }).format(amount);
  return `₦${digits}`;
}

export function discountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(intlTag[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Builds a human-readable order reference. Deterministic on the seed so the
 * confirmation page can render it without a round-trip.
 */
export function orderReference(seed: number): string {
  return `EMM-${seed.toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;
}
