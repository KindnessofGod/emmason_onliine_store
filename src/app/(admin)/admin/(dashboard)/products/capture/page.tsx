import Link from "next/link";
import { listAdminCategories } from "@/lib/admin-data";
import { ProductCaptureForm } from "@/components/admin/product-capture-form";

export default async function ProductCapturePage() {
  const categories = await listAdminCategories();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-500 hover:text-brand-600">
        ← Back to products
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Capture a product</h1>
      <p className="mt-1 text-sm text-ink-500">
        Pick a category, photograph the box, and let the AI prefill the specs. The
        product lands as a draft, pending review — nothing here needs to be perfect.
      </p>
      <ProductCaptureForm categories={categories} />
    </>
  );
}
