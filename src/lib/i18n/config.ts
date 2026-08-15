export const locales = ["en", "yo", "ig", "ha", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Display metadata for the language switcher. `native` is what users actually see. */
export const localeMeta: Record<Locale, { native: string; english: string; flag: string }> = {
  en: { native: "English", english: "English", flag: "🇬🇧" },
  yo: { native: "Yorùbá", english: "Yoruba", flag: "🇳🇬" },
  ig: { native: "Igbo", english: "Igbo", flag: "🇳🇬" },
  ha: { native: "Hausa", english: "Hausa", flag: "🇳🇬" },
  fr: { native: "Français", english: "French", flag: "🇫🇷" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
