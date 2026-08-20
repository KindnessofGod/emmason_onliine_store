"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, X } from "lucide-react";
import { saveProduct } from "@/actions/admin";
import { koboToNaira } from "@/lib/money";
import { PRODUCT_STATUSES } from "@/lib/product-status";
import { specTemplateForCategory } from "@/lib/data/category-spec-templates";
import { normalizeSpecKey, specLabel, type SpecKey } from "@/lib/data/spec-labels";
import type { DbCategory, DbProduct } from "@/lib/db-types";

/** One row of the working spec list — every template field and every custom
 *  field is one of these, so there is a single source of truth for `specs`
 *  regardless of whether a row is currently shown as a named field or a
 *  free key/value row (that classification is derived at render time from
 *  the selected category's template, in `ProductForm` below, so nothing is
 *  hidden after a category switch — it just moves between the two lists). */
type SpecEntry = { id: string; key: string; value: string };

function makeSpecId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function specEntriesFromProduct(specs: Record<string, string> | undefined): SpecEntry[] {
  return Object.entries(specs ?? {}).map(([key, value]) => ({
    id: makeSpecId(),
    key,
    value,
  }));
}

/** Turn a product name into a URL slug as the user types. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export function ProductForm({
  categories,
  product,
}: {
  categories: DbCategory[];
  product?: DbProduct;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(product?.slug ?? "");
  // Only auto-fill the slug for new products; changing a live slug breaks links.
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const specTemplate = specTemplateForCategory(selectedCategory?.slug);

  const [specEntries, setSpecEntries] = useState<SpecEntry[]>(() =>
    specEntriesFromProduct(product?.specs),
  );

  const specsJson = useMemo(
    () =>
      JSON.stringify(
        Object.fromEntries(
          specEntries
            .map((entry): [string, string] => [entry.key.trim(), entry.value.trim()])
            .filter(([key, value]) => key.length > 0 && value.length > 0),
        ),
      ),
    [specEntries],
  );

  // A row counts as a template row if its (normalized) key matches one of the
  // selected category's template fields; every other row is a custom field.
  // Recomputed on every category change so switching categories re-buckets
  // rows instead of losing them.
  const templateKeySet = useMemo(
    () => new Set(specTemplate.map((specKey) => normalizeSpecKey(specKey))),
    [specTemplate],
  );
  const entryByTemplateKey = useMemo(() => {
    const map = new Map<string, SpecEntry>();
    for (const entry of specEntries) {
      const key = normalizeSpecKey(entry.key);
      if (templateKeySet.has(key)) map.set(key, entry);
    }
    return map;
  }, [specEntries, templateKeySet]);
  const customEntries = specEntries.filter(
    (entry) => !templateKeySet.has(normalizeSpecKey(entry.key)),
  );

  /** Set (or create) the entry for a template field, matching an existing
   *  row by normalized key regardless of how it was originally cased. */
  function setTemplateSpecValue(specKey: SpecKey, value: string) {
    setSpecEntries((entries) => {
      const target = normalizeSpecKey(specKey);
      const index = entries.findIndex((entry) => normalizeSpecKey(entry.key) === target);
      if (index === -1) {
        return [...entries, { id: makeSpecId(), key: specLabel[specKey].en, value }];
      }
      const next = [...entries];
      next[index] = { ...next[index], value };
      return next;
    });
  }

  function addCustomSpecField() {
    setSpecEntries((entries) => [...entries, { id: makeSpecId(), key: "", value: "" }]);
  }

  function updateCustomSpecField(id: string, field: "key" | "value", value: string) {
    setSpecEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    );
  }

  function removeCustomSpecField(id: string) {
    setSpecEntries((entries) => entries.filter((entry) => entry.id !== id));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveProduct(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <fieldset className="rounded-xl border border-ink-200 bg-white p-5">
        <legend className="px-1 text-sm font-semibold">Details</legend>

        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Product name</Label>
            <input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="slug">URL slug</Label>
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={`${inputClass} font-mono`}
            />
            <p className="mt-1 text-xs text-ink-500">
              The page address: /product/{slug || "…"}
            </p>
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <input
              id="brand"
              name="brand"
              defaultValue={product?.brand ?? ""}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={product?.description ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-ink-200 bg-white p-5">
        <legend className="px-1 text-sm font-semibold">Price &amp; stock</legend>

        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="priceNaira">Selling price (₦)</Label>
            <input
              id="priceNaira"
              name="priceNaira"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={product ? koboToNaira(product.price_kobo) : ""}
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="compareAtNaira">
              &lsquo;Was&rsquo; price (₦)
            </Label>
            <input
              id="compareAtNaira"
              name="compareAtNaira"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                product?.compare_at_price_kobo
                  ? koboToNaira(product.compare_at_price_kobo)
                  : ""
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-500">
              Optional. Shows a discount badge.
            </p>
          </div>

          <div>
            <Label htmlFor="stock">Stock</Label>
            <input
              id="stock"
              name="stock"
              type="number"
              min={0}
              required
              defaultValue={product?.stock ?? 0}
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <input
              id="sku"
              name="sku"
              defaultValue={product?.sku ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="warrantyMonths">Warranty (months)</Label>
            <input
              id="warrantyMonths"
              name="warrantyMonths"
              type="number"
              min={0}
              max={120}
              defaultValue={product?.warranty_months ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-ink-200 bg-white p-5">
        <legend className="px-1 text-sm font-semibold">Specifications</legend>

        <input type="hidden" name="specs" value={specsJson} />

        {selectedCategory ? (
          specTemplate.length > 0 ? (
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {specTemplate.map((specKey) => {
                const entry = entryByTemplateKey.get(normalizeSpecKey(specKey));
                return (
                  <div key={specKey}>
                    <Label htmlFor={`spec-${specKey}`}>{specLabel[specKey].en}</Label>
                    <input
                      id={`spec-${specKey}`}
                      value={entry?.value ?? ""}
                      onChange={(event) => setTemplateSpecValue(specKey, event.target.value)}
                      className={inputClass}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-xs text-ink-500">
              No spec template for this category yet — use custom fields below.
            </p>
          )
        ) : (
          <p className="mt-2 text-xs text-ink-500">
            Choose a category above to see its spec fields.
          </p>
        )}

        <div className="mt-5 border-t border-ink-100 pt-4">
          <p className="text-sm font-medium">Custom fields</p>
          <p className="mt-1 text-xs text-ink-500">
            Anything not covered by the fields above — added as its own row on the
            product page.
          </p>

          <div className="mt-3 space-y-2">
            {customEntries.map((entry) => (
              <div key={entry.id} className="flex gap-2">
                <input
                  aria-label="Custom spec name"
                  placeholder="Name (e.g. Weight)"
                  value={entry.key}
                  onChange={(event) =>
                    updateCustomSpecField(entry.id, "key", event.target.value)
                  }
                  className={`${inputClass} mt-0 w-2/5`}
                />
                <input
                  aria-label="Custom spec value"
                  placeholder="Value"
                  value={entry.value}
                  onChange={(event) =>
                    updateCustomSpecField(entry.id, "value", event.target.value)
                  }
                  className={`${inputClass} mt-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeCustomSpecField(entry.id)}
                  aria-label="Remove custom field"
                  className="rounded-lg border border-ink-200 px-2 text-ink-500 transition hover:border-red-300 hover:text-red-600"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCustomSpecField}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-400 hover:text-brand-700"
          >
            <Plus className="size-3.5" aria-hidden />
            Add custom field
          </button>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-ink-200 bg-white p-5">
        <legend className="px-1 text-sm font-semibold">Images &amp; visibility</legend>

        <div className="mt-2 space-y-4">
          <div>
            <Label htmlFor="imageUrls">Image URLs</Label>
            <textarea
              id="imageUrls"
              name="imageUrls"
              rows={3}
              defaultValue={(product?.images ?? []).join("\n")}
              placeholder="One URL per line"
              className={`${inputClass} font-mono text-xs`}
            />
            <p className="mt-1 text-xs text-ink-500">
              One per line. Leave empty to use the generated placeholder tile.
            </p>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={product?.status ?? "published"}
              className={inputClass}
            >
              {PRODUCT_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} — {item.description}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.is_featured ?? false}
              className="size-4 rounded border-ink-200"
            />
            Feature on the home page
          </label>
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {product ? "Save changes" : "Create product"}
        </button>
        <Link
          href="/admin/products"
          className="rounded-lg border border-ink-200 px-6 py-3 text-sm font-medium transition hover:border-brand-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
    </label>
  );
}
