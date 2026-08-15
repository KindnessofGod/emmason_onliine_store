import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/admin-data";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-muted-foreground hover:text-brand-600"
      >
        ← Back to products
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="text-sm text-brand-600 hover:underline dark:text-brand-300"
        >
          View in store →
        </Link>
      </div>

      <ProductForm categories={categories} product={product} />
    </>
  );
}
