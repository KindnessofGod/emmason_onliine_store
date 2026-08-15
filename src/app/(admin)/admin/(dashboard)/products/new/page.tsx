import Link from "next/link";
import { listAdminCategories } from "@/lib/admin-data";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await listAdminCategories();

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-ink-500 hover:text-brand-600"
      >
        ← Back to products
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">New product</h1>
      <ProductForm categories={categories} />
    </>
  );
}
