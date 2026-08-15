/**
 * Money helpers.
 *
 * Everything is stored and passed around as integer kobo. Naira only appears
 * at the moment of display, so no arithmetic ever touches a float.
 */

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nairaWithKoboFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format kobo as naira for display, e.g. 4500000 -> "₦45,000".
 * Kobo are shown only when the amount is not a whole naira, which for a
 * catalogue priced in round thousands means essentially never.
 */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return Number.isInteger(naira)
    ? nairaFormatter.format(naira)
    : nairaWithKoboFormatter.format(naira);
}

/** Naira to kobo, for reading admin form input. */
export function nairaToKobo(naira: number | string): number {
  const value = typeof naira === "string" ? Number.parseFloat(naira) : naira;
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** Kobo to naira, for populating admin form fields. */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/** Whole-percent discount, for the "-25%" badge. */
export function discountPercent(priceKobo: number, compareAtKobo: number | null): number | null {
  if (!compareAtKobo || compareAtKobo <= priceKobo) return null;
  return Math.round(((compareAtKobo - priceKobo) / compareAtKobo) * 100);
}
