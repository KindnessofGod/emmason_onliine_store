import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminProducts } from "@/lib/admin-data";
import { getCategories } from "@/lib/catalog";
import { formatNaira } from "@/lib/money";
import { StockEditor } from "@/components/admin/stock-editor";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const categories = await getCategories();
  const selected = categories.find((item) => item.slug === category);

  const products = await listAdminProducts({
    search: q,
    categoryId: selected?.id,
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus className="size-4" aria-hidden />
          New product
        </Link>
      </div>

      <form className="mt-5 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, brand or SKU"
          className="min-w-56 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-brand-400"
        >
          Filter
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
        {products.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted-foreground">
            No products match.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-brand-600 hover:underline dark:text-brand-300"
                      >
                        {product.name}
                      </Link>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category_name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatNaira(product.price_kobo)}
                    </td>
                    <td className="px-4 py-3">
                      <StockEditor productId={product.id} stock={product.stock} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {!product.is_active && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            Hidden
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="rounded-full bg-accent-400/25 px-2 py-0.5 text-xs font-medium text-accent-600">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
