import { defaultLocale, type Locale } from "./config";
import en, { type Dictionary } from "./dictionaries/en";
import fr from "./dictionaries/fr";
import ha from "./dictionaries/ha";
import ig from "./dictionaries/ig";
import yo from "./dictionaries/yo";

const dictionaries: Record<Locale, Dictionary> = { en, yo, ig, ha, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/**
 * Replaces `{name}` placeholders in a translated string.
 * `interpolate(d.product.save, { percent: 20 })` -> "Save 20%"
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/**
 * Picks the singular or plural message for a count, then interpolates it.
 * Only the two-form (one / other) distinction is modelled — that covers English
 * and French, and Yoruba, Igbo and Hausa do not inflect these nouns at all.
 */
export function pluralize(
  count: number,
  one: string,
  other: string,
  vars: Record<string, string | number> = {},
): string {
  return interpolate(count === 1 ? one : other, { count, ...vars });
}

/** Prefixes an app-relative path with the active locale. `href("yo", "/cart")` -> "/yo/cart" */
export function href(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

export { defaultLocale, locales, localeMeta, isLocale } from "./config";
export type { Locale } from "./config";
export type { Dictionary } from "./dictionaries/en";
