"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { saveProduct } from "@/actions/admin";
import { koboToNaira } from "@/lib/money";
import type { Category, Product } from "@/lib/types";

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
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(product?.slug ?? "");
  // Only auto-fill the slug for new products; changing a live slug breaks links.
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

      <fieldset className="rounded-xl border border-border bg-card p-5">
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
            <p className="mt-1 text-xs text-muted-foreground">
              The page address: /product/{slug || "…"}
            </p>
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product?.category_id ?? ""}
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

      <fieldset className="rounded-xl border border-border bg-card p-5">
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
            <p className="mt-1 text-xs text-muted-foreground">
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

      <fieldset className="rounded-xl border border-border bg-card p-5">
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
            <p className="mt-1 text-xs text-muted-foreground">
              One per line. Leave empty to use the generated placeholder tile.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.is_active ?? true}
              className="size-4 rounded border-border"
            />
            Visible in the store
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.is_featured ?? false}
              className="size-4 rounded border-border"
            />
            Feature on the home page
          </label>
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
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
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition hover:border-brand-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
    </label>
  );
}
