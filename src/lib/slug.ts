/** Turn free text (a product name typed by staff, or one inferred by AI
 *  capture) into a URL slug. Shared by the admin product form (typed live as
 *  the name field changes) and the mobile capture flow (run once, server-side,
 *  on whatever name the AI extracted) so both produce slugs the same way. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}
