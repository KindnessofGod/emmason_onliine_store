"use server";

import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { saveProduct } from "@/actions/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { specTemplateForCategory } from "@/lib/data/category-spec-templates";
import { specLabel, type SpecKey } from "@/lib/data/spec-labels";
import { MAX_CAPTURE_PHOTOS } from "@/lib/product-capture-config";
import { slugify } from "@/lib/slug";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Mobile capture + AI extraction (ticket #8, ADR-0002): staff photograph a
 * product's box on their phone, and this reads the photos with Claude to
 * prefill that category's spec template — landing at `pending_review` so a
 * human still signs off before it reaches the storefront. Kept out of
 * actions/admin.ts because it owns a different reason to change (the vision
 * prompt / extraction schema) than the rest of that file's CRUD and
 * stock-ledger actions — see Divergent Change in the self-review notes.
 */

// Claude Haiku is the deliberate model choice for this flow (see ticket #8 /
// the conversation it came from): it's the cheapest tier that still reads
// text off a product box reliably, and every call is billed to the shop
// owner's own ANTHROPIC_API_KEY (see .env.example), not ours.
const EXTRACTION_MODEL = "claude-haiku-4-5";

export type CaptureResult =
  | { ok: true; productName: string }
  | { ok: false; error: string };

const extractionInputSchema = z.object({
  categoryId: z.uuid("Choose a category"),
  imageUrls: z
    .array(z.url())
    .min(1, "Take at least one photo of the box")
    .max(MAX_CAPTURE_PHOTOS, `Use at most ${MAX_CAPTURE_PHOTOS} photos`),
});

/** One nullable string field per category spec key, plus the product's name
 *  and brand — the only things we ask Claude to read off the box. Building
 *  this per-request (rather than one fixed schema) is what keeps the model
 *  constrained to *this category's* known spec-label keys instead of
 *  inventing its own field names that `specLabel` wouldn't recognise.
 *
 *  `specShape` is typed as `Partial<Record<SpecKey, …>>` (a finite key
 *  union), not `Record<string, …>` — a plain string index signature would
 *  collapse `productName`/`brand`'s literal typing when spread into the
 *  object literal below, since Zod's shape-merge treats an index-signature
 *  key set as overriding every specific key that's a subtype of `string`. */
function buildExtractionSchema(specKeys: SpecKey[]) {
  const specShape: Partial<Record<SpecKey, z.ZodNullable<z.ZodString>>> = {};
  for (const key of specKeys) {
    specShape[key] = z
      .string()
      .nullable()
      .describe(`${specLabel[key].en} — read directly off the box. Null if not shown there.`);
  }

  return z.object({
    productName: z
      .string()
      .nullable()
      .describe(
        'The product\'s name/model as printed on the box, e.g. "Redmi Note 13 5G". Null if not legible.',
      ),
    brand: z
      .string()
      .nullable()
      .describe("The brand/manufacturer name as printed on the box. Null if not legible."),
    ...specShape,
  });
}

function buildExtractionPrompt(categoryName: string, specKeys: SpecKey[]): string {
  const fieldList =
    specKeys.length > 0
      ? specKeys.map((key) => `- ${specLabel[key].en}`).join("\n")
      : "(this category has no named spec fields yet — just the name and brand)";

  return `These photos show the box/packaging of a "${categoryName}" product, taken with a phone camera in the shop. Read whatever is printed on the box and fill in:

- The product's name/model
- The brand/manufacturer
${fieldList}`;
}

function extractionErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "The shop's Anthropic API key is missing or invalid — ask the owner to check ANTHROPIC_API_KEY.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "Claude is rate-limited right now — wait a moment and try again.";
  }
  if (error instanceof Anthropic.APIError) {
    return `Claude couldn't process those photos (${error.status ?? "request failed"}).`;
  }
  return error instanceof Error ? error.message : "Could not read the photos.";
}

/**
 * Take the uploaded box photos + chosen category, ask Claude to read the box
 * against that category's spec template, and create a `pending_review`
 * product from the result. Price, SKU and slug aren't things a photo of a
 * box can reliably tell us — they get safe placeholders here (price 0, no
 * SKU, an auto-generated slug) for staff to fix during review; that's the
 * whole point of landing at pending_review instead of publishing directly.
 */
export async function extractProductFromPhotos(
  categoryId: string,
  imageUrls: string[],
): Promise<CaptureResult> {
  await requireAdmin();

  const parsedInput = extractionInputSchema.safeParse({ categoryId, imageUrls });
  if (!parsedInput.success) {
    const message = z.flattenError(parsedInput.error).fieldErrors;
    return { ok: false, error: Object.values(message).flat()[0] ?? "Invalid capture request." };
  }
  const input = parsedInput.data;

  const supabase = createSupabaseAdminClient();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("id", input.categoryId)
    .maybeSingle();

  if (categoryError) return { ok: false, error: categoryError.message };
  if (!category) return { ok: false, error: "Choose a category" };

  const specTemplate = specTemplateForCategory(category.slug);
  const ExtractionSchema = buildExtractionSchema(specTemplate);

  let parsedOutput: z.infer<typeof ExtractionSchema> | null;
  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 4096,
      system:
        "You are helping shop staff catalogue new inventory for a Nigerian phone and electronics store. You'll be shown photos of a product's box, taken with a phone camera on the shop floor. Read only text and specs actually printed on the box — never guess, infer, or fall back on general knowledge about the product line. Leave a field null if it isn't legible in the photos.",
      messages: [
        {
          role: "user",
          content: [
            ...input.imageUrls.map((url) => ({
              type: "image" as const,
              source: { type: "url" as const, url },
            })),
            { type: "text" as const, text: buildExtractionPrompt(category.name, specTemplate) },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(ExtractionSchema) },
    });
    parsedOutput = response.parsed_output;
  } catch (error) {
    return { ok: false, error: extractionErrorMessage(error) };
  }

  if (!parsedOutput) {
    return {
      ok: false,
      error: "Claude couldn't read those photos clearly. Try retaking them in better light.",
    };
  }

  const specs: Record<string, string> = {};
  for (const key of specTemplate) {
    const value = parsedOutput[key];
    if (typeof value === "string" && value.trim().length > 0) {
      specs[key] = value.trim();
    }
  }

  const inferredName = parsedOutput.productName?.trim();
  // Clamped to saveProduct's own field limits (name max 200, brand max 80) —
  // a box's text is normally well within these, but nothing stops a model
  // from reading a whole paragraph off a spec sticker, and an over-length
  // value would otherwise fail saveProduct's validation and lose the draft
  // entirely rather than landing it in pending_review for a human to trim.
  const name = (
    inferredName && inferredName.length >= 3 ? inferredName : `${category.name} (needs a name)`
  ).slice(0, 200);
  const brand = parsedOutput.brand?.trim().slice(0, 80);
  // Falls back to a literal prefix when the name has no romanised
  // letters/digits to slugify (e.g. read as symbols only) — otherwise the
  // slug would be just the random suffix with a leading hyphen, which fails
  // saveProduct's slug format check.
  const slugBase = slugify(name) || "product";
  // Always suffixed, even for a real inferred name — two staff photographing
  // the same phone model on the same day would otherwise collide on slug
  // uniqueness (enforced by saveProduct/the DB) before either reaches review.
  const slug = `${slugBase}-${randomUUID().slice(0, 8)}`.slice(0, 200);

  const formData = new FormData();
  formData.set("categoryId", category.id);
  formData.set("name", name);
  formData.set("slug", slug);
  if (brand) formData.set("brand", brand);
  formData.set("priceNaira", "0");
  formData.set("stock", "0");
  formData.set("imageUrls", input.imageUrls.join("\n"));
  formData.set("specs", JSON.stringify(specs));
  formData.set("status", "pending_review");

  const result = await saveProduct(formData);
  if (!result.ok) return result;

  return { ok: true, productName: name };
}
