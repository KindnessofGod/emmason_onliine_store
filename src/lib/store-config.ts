/** Store-wide settings, all overridable by environment variable. */
export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Emmason Store",
  tagline: "Gadgets, sound and home essentials — delivered across Nigeria.",
  /** Digits only, international format. e.g. 2348012345678 */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348000000000",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  currency: "NGN",
} as const;

/** Pretty-print the WhatsApp number for display: +234 801 234 5678 */
export function formatWhatsAppNumber(digits: string = storeConfig.whatsappNumber): string {
  const clean = digits.replace(/\D/g, "");
  if (clean.startsWith("234") && clean.length === 13) {
    return `+234 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return `+${clean}`;
}
