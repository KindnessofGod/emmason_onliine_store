import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { ShopFilters, SortSelect } from "@/components/shop-filters";
import { Breadcrumbs, EmptyState } from "@/components/ui";
import {
  getCategories,
  getCategory,
  getPriceBounds,
  queryProducts,
  type SortKey,
} from "@/lib/data";
import { getDictionary, href, pluralize, isLocale, locales } from "@/lib/i18n";
import type { Condition } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateStaticParams() {
  const categories = await getCategories();
  return locales.flatMap((locale) =>
    categories.map((category) => ({ locale, slug: category.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: category.name[locale],
    description: category.tagline[locale],
  };
}

function parseSort(value: string | undefined): SortKey {
  return value === "price-asc" || value === "price-desc" || value === "newest"
    ? value
    : "featured";
}

function parseCondition(value: string | undefined): Condition | undefined {
  return value === "new" || value === "uk-used" || value === "refurbished" ? value : undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const category = await getCategory(slug);
  if (!category) notFound();

  const dict = getDictionary(locale);
  const sp = await searchParams;

  const [results, categories, bounds] = await Promise.all([
    queryProducts({
      category: slug,
      condition: parseCondition(first(sp.condition)),
      minPrice: parseNumber(first(sp.min)),
      maxPrice: parseNumber(first(sp.max)),
      sort: parseSort(first(sp.sort)),
    }),
    getCategories(),
    getPriceBounds(),
  ]);

  return (
    <div>
      <div
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(145deg, ${category.gradient[0]} 0%, ${category.gradient[1]} 100%)`,
        }}
      >
        {category.showcaseImage ? (
          <>
            <Image
              src={category.showcaseImage}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            {/* Strong scrim — this photo carries no decorative wave and needs
                to hold up the headline on its own across the full width. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-ink-950/20"
            />
          </>
        ) : (
          <svg
            viewBox="0 0 1200 300"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path d="M0 200 Q300 150 600 185 T1200 165 V300 H0 Z" fill="white" fillOpacity="0.13" />
            <circle cx="1050" cy="60" r="130" fill="white" fillOpacity="0.07" />
          </svg>
        )}
        <div className="container-page relative py-12">
          {!category.showcaseImage && (
            <span className="text-4xl" aria-hidden="true">
              {category.glyph}
            </span>
          )}
          <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${category.showcaseImage ? "" : "mt-3"}`}>
            {category.name[locale]}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">
            {category.tagline[locale]}
          </p>
        </div>
      </div>

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: dict.nav.home, href: href(locale) },
            { label: dict.shop.title, href: href(locale, "/shop") },
            { label: category.name[locale] },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <Suspense fallback={<div aria-hidden="true" className="h-10" />}>
            <ShopFilters
              locale={locale}
              dict={dict}
              categories={categories}
              bounds={bounds}
              lockedCategory={slug}
            />
          </Suspense>

          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-500">
                {pluralize(results.length, dict.shop.resultsCountOne, dict.shop.resultsCount)}
              </p>
              <Suspense fallback={<div aria-hidden="true" className="h-10 w-32" />}>
                <SortSelect dict={dict} />
              </Suspense>
            </div>

            {results.length > 0 ? (
              <ProductGrid products={results} locale={locale} dict={dict} />
            ) : (
              <EmptyState title={dict.shop.noResults} body={dict.shop.clearFilters} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
