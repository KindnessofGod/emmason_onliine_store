import type { SpecKey } from "./spec-labels";

/**
 * Per-category ordered list of spec fields shown in the admin product form,
 * drawn from `specLabel`. Staff can still add custom key/value fields beyond
 * a category's template — this only decides which named fields show up
 * first. Keyed by category slug (see `supabase/seed.sql`), not by id, so it
 * needs no database round-trip to read.
 */
export const categorySpecTemplates: Record<string, SpecKey[]> = {
  "chargers-power-banks": ["capacity", "output", "charging", "size"],
  "bluetooth-speakers": ["output", "playtime", "connectivity", "waterResistance"],
  earbuds: ["playtime", "connectivity", "noiseCancelling", "waterResistance", "charging"],
  headsets: ["playtime", "connectivity", "driver", "noiseCancelling"],
  "smart-watches": ["display", "battery", "connectivity", "waterResistance", "compatibility"],
  "smart-glasses": ["connectivity", "playtime", "material", "compatibility"],
  "button-phones": ["display", "battery", "network", "camera"],
  "kids-tablets": ["display", "storage", "memory", "battery"],
  cameras: ["resolution", "storage", "connectivity", "waterResistance", "battery"],
  microphones: ["type", "connectivity", "compatibility", "power"],
  tripods: ["size", "mount", "capacity", "compatibility"],
  "car-stereos": ["display", "connectivity", "compatibility", "output"],
  clippers: ["runtime", "power", "material", "charging"],
  fans: ["size", "runtime", "power", "charging"],
  "home-appliances": ["power", "capacity", "material", "size"],
  "multi-tool-kits": ["inTheBox", "compatibility", "material"],
};

/** The template for a category slug, or an empty list for an unmapped one
 *  (a new category added in the DB before this file catches up, or none
 *  selected yet) — staff fall back to custom fields until it's added here. */
export function specTemplateForCategory(slug: string | null | undefined): SpecKey[] {
  if (!slug) return [];
  return categorySpecTemplates[slug] ?? [];
}
