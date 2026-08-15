import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-muted-foreground hover:text-brand-600"
      >
        ← Back to products
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">New product</h1>
      <ProductForm categories={categories} />
    </>
  );
}
