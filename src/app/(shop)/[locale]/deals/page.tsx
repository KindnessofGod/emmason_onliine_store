import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { Breadcrumbs, EmptyState } from "@/components/ui";
import { onSaleProducts } from "@/lib/data";
import { getDictionary, href, pluralize, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.nav.deals, description: dict.home.featuredSubtitle };
}

export default async function DealsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const deals = await onSaleProducts(100);

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: dict.nav.home, href: href(locale) }, { label: dict.nav.deals }]}
      />

      <div className="mb-8 overflow-hidden rounded-card bg-flash-500 px-6 py-10 text-white sm:px-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {dict.home.featuredTitle}
        </h1>
        <p className="mt-2 text-white/90">{dict.home.featuredSubtitle}</p>
        <p className="mt-4 text-sm font-bold">
          {pluralize(deals.length, dict.shop.resultsCountOne, dict.shop.resultsCount)}
        </p>
      </div>

      {deals.length > 0 ? (
        <ProductGrid products={deals} locale={locale} dict={dict} />
      ) : (
        <EmptyState title={dict.shop.noResults} />
      )}
    </div>
  );
}
