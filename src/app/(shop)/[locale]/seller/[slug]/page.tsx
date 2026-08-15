import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PinIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { Breadcrumbs, EmptyState, Rating, VerifiedBadge } from "@/components/ui";
import { getSellerBySlug, getSellers, queryProducts } from "@/lib/data";
import { getDictionary, href, interpolate, pluralize, isLocale, locales } from "@/lib/i18n";

export async function generateStaticParams() {
  const sellers = await getSellers();
  return locales.flatMap((locale) => sellers.map((seller) => ({ locale, slug: seller.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const seller = await getSellerBySlug(slug);
  if (!seller) return {};
  return { title: seller.name, description: seller.bio[locale] };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const seller = await getSellerBySlug(slug);
  if (!seller) notFound();

  const dict = getDictionary(locale);
  const listings = await queryProducts({ seller: seller.id });

  return (
    <div>
      <div className="relative overflow-hidden bg-brand-700 text-white">
        <svg
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path d="M0 200 Q300 150 600 185 T1200 165 V300 H0 Z" fill="#83d243" fillOpacity="0.35" />
          <circle cx="1050" cy="50" r="120" fill="white" fillOpacity="0.07" />
        </svg>

        <div className="container-page relative flex flex-col gap-5 py-12 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-extrabold text-brand-700">
            {seller.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {seller.name}
              </h1>
              {seller.verified ? (
                <VerifiedBadge label={dict.seller.verifiedSeller} />
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  {dict.seller.pendingSeller}
                </span>
              )}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
              <span className="flex items-center gap-1.5">
                <PinIcon className="h-4 w-4" />
                {seller.city}, {seller.state}
              </span>
              <span>{interpolate(dict.seller.memberSince, { year: seller.since })}</span>
              <span>{pluralize(listings.length, dict.seller.productCountOne, dict.seller.productCount)}</span>
            </p>
            <div className="mt-3 inline-flex rounded-lg bg-white px-2.5 py-1.5">
              <Rating value={seller.rating} count={seller.reviewCount} />
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            { label: dict.nav.home, href: href(locale) },
            { label: dict.home.sellersTitle, href: href(locale, "/sell") },
            { label: seller.name },
          ]}
        />

        <p className="mb-8 max-w-2xl leading-relaxed text-ink-600">{seller.bio[locale]}</p>

        <h2 className="mb-5 text-xl font-extrabold text-ink-900">
          {interpolate(dict.seller.shopTitle, { name: seller.name })}
        </h2>

        {listings.length > 0 ? (
          <ProductGrid products={listings} locale={locale} dict={dict} />
        ) : (
          <EmptyState title={dict.shop.noResults} />
        )}
      </div>
    </div>
  );
}
