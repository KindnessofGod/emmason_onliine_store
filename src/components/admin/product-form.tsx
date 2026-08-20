"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Loader2, Trash2, UploadCloud } from "lucide-react";
import { saveProduct, uploadProductImage } from "@/actions/admin";
import { koboToNaira } from "@/lib/money";
import { PRODUCT_STATUSES } from "@/lib/product-status";
import type { DbCategory, DbProduct } from "@/lib/db-types";

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
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  // Lifted out of the picker so the submit button can stay disabled until
  // every in-flight upload has either landed in `images` or failed.
  const [imagesUploading, setImagesUploading] = useState(false);

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
        <legend className="px-1 text-sm font-semibold">Images &amp; visibility</legend>

        <div className="mt-2 space-y-4">
          <ProductImagePicker
            images={images}
            onChange={setImages}
            uploading={imagesUploading}
            onUploadingChange={setImagesUploading}
          />
          {/* saveProduct still parses a newline/comma-separated string into
              the `images text[]` column, so the picker's URLs are folded
              back into that same wire shape here. */}
          <input type="hidden" name="imageUrls" value={images.join("\n")} />

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
          disabled={pending || imagesUploading}
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

/**
 * Picks, uploads, previews and reorders a product's photos. Each file is
 * compressed and stored server-side by `uploadProductImage` as soon as it's
 * picked (not deferred to form submit), so staff see the real hosted photo —
 * and any per-file upload failure — immediately rather than at save time.
 */
function ProductImagePicker({
  images,
  onChange,
  uploading,
  onUploadingChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-picking the same file later
    if (files.length === 0) return;

    onUploadingChange(true);
    setUploadError(null);

    // Sequential, not Promise.all: keeps uploaded URLs in the same order the
    // files were picked in, and a phone on a slow connection isn't asked to
    // push several multi-megabyte uploads at once.
    const uploaded: string[] = [];
    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      const result = await uploadProductImage(body);
      if (result.ok) {
        uploaded.push(result.url);
      } else {
        setUploadError(result.error);
      }
    }

    if (uploaded.length > 0) onChange([...images, ...uploaded]);
    onUploadingChange(false);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Label htmlFor="productImageFiles">Photos</Label>

      {images.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {images.map((url, index) => (
            <li key={url} className="w-24">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                {/* Plain <img>, not next/image: older products may still carry
                    externally-hosted URLs pasted before this feature existed,
                    and the image optimizer only trusts our own Supabase
                    storage origin (see next.config.ts remotePatterns). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Product photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Primary
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move photo earlier"
                  className="rounded border border-ink-200 p-1 disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move photo later"
                  className="rounded border border-ink-200 p-1 disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove photo"
                  className="rounded border border-ink-200 p-1 text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label
        htmlFor="productImageFiles"
        className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-300 px-4 py-2 text-sm font-medium text-ink-600 hover:border-brand-400 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <UploadCloud className="size-4" aria-hidden />
        )}
        {uploading ? "Uploading…" : "Add photos"}
      </label>
      {/* `capture` opens the phone's camera app alongside the regular photo
          library picker (see docs/adr/0002-mobile-web-not-native-app.md) —
          browsers that don't support it just fall back to a normal picker. */}
      <input
        id="productImageFiles"
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFilesSelected}
        disabled={uploading}
        className="sr-only"
      />

      {uploadError && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {uploadError}
        </p>
      )}

      <p className="mt-1 text-xs text-ink-500">
        First photo is the primary image shown on the storefront. Leave empty to use the
        generated placeholder tile.
      </p>
    </div>
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
