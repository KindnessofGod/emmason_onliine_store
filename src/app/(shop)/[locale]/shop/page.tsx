import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { ShopFilters, SortSelect } from "@/components/shop-filters";
import { Breadcrumbs, EmptyState } from "@/components/ui";
import {
  getCategories,
  getPriceBounds,
  queryProducts,
  type SortKey,
} from "@/lib/data";
import {
  getDictionary,
  href,
  interpolate,
  pluralize,
  isLocale,
} from "@/lib/i18n";
import type { Condition } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).shop.title };
}

/** Narrows a raw query value to one of the sort keys the data layer accepts. */
function parseSort(value: string | undefined): SortKey {
  return value === "price-asc" || value === "price-desc" || value === "newest"
    ? value
    : "featured";
}

function parseCondition(value: string | undefined): Condition | undefined {
  return value === "new" || value === "uk-used" || value === "refurbished"
    ? value
    : undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const sp = await searchParams;

  const search = first(sp.q);
  const [results, categories, bounds] = await Promise.all([
    queryProducts({
      category: first(sp.category),
      condition: parseCondition(first(sp.condition)),
      minPrice: parseNumber(first(sp.min)),
      maxPrice: parseNumber(first(sp.max)),
      search,
      sort: parseSort(first(sp.sort)),
    }),
    getCategories(),
    getPriceBounds(),
  ]);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: href(locale) },
          { label: dict.shop.title },
        ]}
      />

      <div className="mb-5 lg:mb-7">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {search
            ? interpolate(dict.shop.searchResultsFor, { query: search })
            : dict.shop.title}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {pluralize(
            results.length,
            dict.shop.resultsCountOne,
            dict.shop.resultsCount,
          )}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:gap-8">
        <Suspense fallback={<div aria-hidden="true" className="h-10" />}>
          <ShopFilters
            locale={locale}
            dict={dict}
            categories={categories}
            bounds={bounds}
          />
        </Suspense>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
            <p className="hidden text-sm text-ink-500 lg:block">
              {pluralize(
                results.length,
                dict.shop.resultsCountOne,
                dict.shop.resultsCount,
              )}
            </p>
            <div className="ml-auto">
              <Suspense
                fallback={<div aria-hidden="true" className="h-10 w-32" />}
              >
                <SortSelect dict={dict} />
              </Suspense>
            </div>
          </div>

          {results.length > 0 ? (
            <ProductGrid products={results} locale={locale} dict={dict} />
          ) : (
            <EmptyState
              title={dict.shop.noResults}
              body={dict.shop.clearFilters}
            />
          )}
        </div>
      </div>
    </div>
  );
}
