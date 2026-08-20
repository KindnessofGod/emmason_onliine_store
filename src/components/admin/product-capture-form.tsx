"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { extractProductFromPhotos } from "@/actions/product-capture";
import { Label, ProductImagePicker, inputClass } from "@/components/admin/product-form";
import { MAX_CAPTURE_PHOTOS } from "@/lib/product-capture-config";
import type { DbCategory } from "@/lib/db-types";

/**
 * Mobile-first "photograph the box, let the AI read it" flow (ticket #8,
 * ADR-0002 — a page in the existing dashboard, not a native app). Deliberately
 * thin: category picker + the same photo picker/uploader the full product
 * form already uses (see product-form.tsx) + one action. Everything the AI
 * can't reliably know from a box photo (price, SKU, an exact slug) is left
 * for a human to fill in during review — this only needs to get a
 * `pending_review` draft started.
 */
export function ProductCaptureForm({ categories }: { categories: DbCategory[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = categoryId.length > 0 && images.length > 0 && !imagesUploading && !pending;

  function handleSubmit() {
    setError(null);
    setCreatedName(null);
    startTransition(async () => {
      const result = await extractProductFromPhotos(categoryId, images);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreatedName(result.productName);
      // Reset for the next box — staff typically capture several products
      // from the same category in one visit to the shelf.
      setImages([]);
    });
  }

  return (
    <div className="mt-6 max-w-xl space-y-6">
      {createdName && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Created &ldquo;{createdName}&rdquo; as a draft, pending review.{" "}
            <Link href="/admin/products?status=pending_review" className="font-semibold underline">
              Review it now
            </Link>{" "}
            or capture the next product below.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <Label htmlFor="captureCategory">Category</Label>
        <select
          id="captureCategory"
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

      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <ProductImagePicker
          images={images}
          onChange={setImages}
          uploading={imagesUploading}
          onUploadingChange={setImagesUploading}
        />
        <p className="mt-2 text-xs text-ink-500">
          Photograph the front, back and any spec sticker on the box. Up to{" "}
          {MAX_CAPTURE_PHOTOS} photos.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        {pending ? "Reading the box…" : "Read box & create draft"}
      </button>
    </div>
  );
}
