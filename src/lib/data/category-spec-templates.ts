import type { SpecKey } from "./spec-labels";

/**
 * Per-category ordered list of spec fields shown in the admin product form,
 * drawn from `specLabel`. Staff can still add custom key/value fields beyond
 * a category's template — this only decides which named fields show up
 * first. Keyed by category slug (see `supabase/seed.sql`), not by id, so it
 * needs no database round-trip to read.
 */
export const categorySpecTemplates: Record<string, SpecKey[]> = {
  // Every list below was checked against the spec keys actually used by the
  // 102 seeded products in supabase/seed.sql for that category — not guessed
  // from the category name — so opening an existing product shows its real
  // saved values in these named fields instead of dumping them into "custom
  // fields." A key only appears here if specLabel already has a translated
  // label for it; anything a category uses but this list omits still saves
  // fine as a custom field, it just isn't a named field yet.
  "chargers-power-banks": ["capacity", "output"],
  "bluetooth-speakers": ["output", "battery", "driver"],
  earbuds: ["battery", "charging"],
  headsets: ["battery", "driver"],
  "smart-watches": ["display", "battery", "compatibility"],
  "smart-glasses": ["battery", "storage"],
  "button-phones": ["display", "battery", "camera"],
  "kids-tablets": ["display", "storage", "battery"],
  cameras: ["storage", "battery", "power", "mount"],
  microphones: ["type", "mount", "compatibility", "battery", "power"],
  tripods: ["mount", "power"],
  "car-stereos": ["connectivity", "output", "power", "size"],
  clippers: ["charging", "power", "runtime"],
  fans: ["battery", "charging", "power", "runtime", "size"],
  "home-appliances": ["power", "capacity", "runtime", "brightness"],
  "multi-tool-kits": ["charging", "runtime"],
};

/** The template for a category slug, or an empty list for an unmapped one
 *  (a new category added in the DB before this file catches up, or none
 *  selected yet) — staff fall back to custom fields until it's added here. */
export function specTemplateForCategory(slug: string | null | undefined): SpecKey[] {
  if (!slug) return [];
  return categorySpecTemplates[slug] ?? [];
}
