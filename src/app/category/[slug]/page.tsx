import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  type ProductSort,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

function parseSort(value: string | undefined): ProductSort {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as ProductSort)
    : "featured";
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category) => ({ slug: category.slug }));
  } catch {
    // No database reachable at build time (e.g. a CI build without secrets).
    // Pages still render on demand.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const [{ slug }, { sort }] = await Promise.all([params, searchParams]);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const activeSort = parseSort(sort);
  const products = await getProductsByCategory(slug, activeSort);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/category/${slug}?sort=${option.value}`}
              scroll={false}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeSort === option.value
                  ? "bg-brand-600 text-white"
                  : "border border-border hover:border-brand-400"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing in this category yet. Check back soon.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
