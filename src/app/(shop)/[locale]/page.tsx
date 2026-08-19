import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import {
  ChevronRightIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/icons";
import { Rating, SectionHeading, VerifiedBadge } from "@/components/ui";
import {
  getCategories,
  newArrivals,
  onSaleProducts,
  productCountByCategory,
  productCountBySeller,
  verifiedSellers,
} from "@/lib/data";
import { getDictionary, href, pluralize, isLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const [deals, fresh, sellers, categories] = await Promise.all([
    onSaleProducts(8),
    newArrivals(4),
    verifiedSellers(),
    getCategories(),
  ]);

  // Counts are resolved up front: JSX cannot await inside a .map().
  const [categoryCounts, sellerCounts] = await Promise.all([
    Promise.all(categories.map((category) => productCountByCategory(category.slug))).then(
      (counts) => new Map(categories.map((c, i) => [c.slug, counts[i]])),
    ),
    Promise.all(sellers.map((seller) => productCountBySeller(seller.id))).then((counts) =>
      new Map(sellers.map((s, i) => [s.id, counts[i]])),
    ),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-700">
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path d="M0 420 Q300 340 600 400 T1200 370 V600 H0 Z" fill="#63b824" fillOpacity="0.55" />
          <path d="M0 480 Q320 410 640 460 T1200 440 V600 H0 Z" fill="#83d243" fillOpacity="0.4" />
          <circle cx="1010" cy="120" r="200" fill="white" fillOpacity="0.06" />
        </svg>

        <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-inset ring-white/25">
              <SparkIcon className="h-3.5 w-3.5" />
              {dict.home.heroEyebrow}
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dict.home.heroTitle}
              <br />
              <span className="text-brand-200">{dict.home.heroTitleAccent}</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-50/90 sm:text-lg">
              {dict.home.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={href(locale, "/shop")}
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-800 shadow-soft transition hover:bg-brand-50"
              >
                {dict.home.heroCta}
              </Link>
              <Link
                href={href(locale, "/sell")}
                className="rounded-xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/20"
              >
                {dict.home.heroCtaSecondary}
              </Link>
            </div>
          </div>

          {/* Product collage */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {deals.slice(0, 4).map((product, index) => (
                <Link
                  key={product.id}
                  href={href(locale, `/product/${product.slug}`)}
                  className={`overflow-hidden rounded-2xl shadow-lift transition hover:-translate-y-1 ${
                    index % 2 === 1 ? "translate-y-6" : ""
                  }`}
                >
                  <ProductImage
                    categorySlug={product.categorySlug}
                    name={product.name}
                    src={product.images[0]}
                    className="aspect-square w-full"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative border-t border-white/15 bg-brand-800/40">
          <ul className="container-page grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <TruckIcon className="h-5 w-5" />, label: dict.home.trustDelivery },
              { icon: <ShieldIcon className="h-5 w-5" />, label: dict.home.trustGuarantee },
              { icon: <StoreIcon className="h-5 w-5" />, label: dict.home.trustPickup },
              { icon: <SparkIcon className="h-5 w-5" />, label: dict.home.trustSecure },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                  {item.icon}
                </span>
                <span className="font-semibold text-white">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14">
        <SectionHeading
          title={dict.home.categoriesTitle}
          subtitle={dict.home.categoriesSubtitle}
          actionLabel={dict.home.viewAll}
          actionHref={href(locale, "/shop")}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={href(locale, `/category/${category.slug}`)}
              className="group relative overflow-hidden rounded-card p-5 text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              style={{
                background: `linear-gradient(145deg, ${category.gradient[0]} 0%, ${category.gradient[1]} 100%)`,
              }}
            >
              <svg
                viewBox="0 0 200 200"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <path d="M0 150 Q50 125 100 143 T200 133 V200 H0 Z" fill="white" fillOpacity="0.14" />
              </svg>
              {/* Scrim so the white copy keeps contrast over the lighter gradient stops. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/45 to-transparent"
              />
              <span className="relative block text-3xl" aria-hidden="true">
                {category.glyph}
              </span>
              <h3 className="relative mt-8 text-base font-extrabold leading-tight">
                {category.name[locale]}
              </h3>
              <p className="relative mt-1 line-clamp-2 text-xs text-white/85">
                {category.tagline[locale]}
              </p>
              <p className="relative mt-3 flex items-center gap-1 text-xs font-bold">
                {pluralize(categoryCounts.get(category.slug) ?? 0, dict.seller.productCountOne, dict.seller.productCount)}
                <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* On sale */}
      <section className="bg-ink-50/70 py-14">
        <div className="container-page">
          <SectionHeading
            title={dict.home.featuredTitle}
            subtitle={dict.home.featuredSubtitle}
            actionLabel={dict.home.viewAll}
            actionHref={href(locale, "/deals")}
          />
          <ProductGrid products={deals} locale={locale} dict={dict} />
        </div>
      </section>

      {/* Walk-in store */}
      <section className="container-page py-14">
        <div className="overflow-hidden rounded-card bg-ink-900 text-white">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-300">
                <StoreIcon className="h-3.5 w-3.5" />
                {dict.footer.walkIn}
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {dict.home.storeTitle}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
                {dict.home.storeBody}
              </p>

              <address className="mt-6 flex gap-3 not-italic">
                <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <span className="text-sm leading-relaxed text-ink-200">
                  <strong className="font-bold text-white">{site.address.line1}</strong>
                  <br />
                  {site.address.line2}
                  <br />
                  {site.address.city}, {site.address.state} · {dict.footer.hours}
                </span>
              </address>

              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  `${site.address.line1}, ${site.address.line2}, ${site.address.city}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400"
              >
                {dict.home.storeCta}
                <ChevronRightIcon className="h-4 w-4" />
              </a>
            </div>

            <div className="relative min-h-[240px] bg-brand-600">
              <svg
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <path d="M0 260 Q100 210 200 245 T400 225 V400 H0 Z" fill="#83d243" fillOpacity="0.5" />
                <path d="M0 310 Q120 265 240 295 T400 275 V400 H0 Z" fill="#a6e26e" fillOpacity="0.4" />
                <circle cx="300" cy="110" r="70" fill="white" fillOpacity="0.1" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <StoreIcon className="h-24 w-24 text-white/80" strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-page pb-14">
        <SectionHeading
          title={dict.home.newArrivalsTitle}
          subtitle={dict.home.newArrivalsSubtitle}
          actionLabel={dict.home.viewAll}
          actionHref={`${href(locale, "/shop")}?sort=newest`}
        />
        <ProductGrid products={fresh} locale={locale} dict={dict} />
      </section>

      {/* Sellers */}
      <section className="bg-ink-50/70 py-14">
        <div className="container-page">
          <SectionHeading title={dict.home.sellersTitle} subtitle={dict.home.sellersSubtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.map((seller) => (
              <Link
                key={seller.id}
                href={href(locale, `/seller/${seller.slug}`)}
                className="flex flex-col rounded-card border border-ink-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-800">
                    {seller.name.charAt(0)}
                  </span>
                  <VerifiedBadge label={dict.product.verified} />
                </div>
                <h3 className="mt-3 text-sm font-extrabold leading-snug text-ink-900">
                  {seller.name}
                </h3>
                <p className="mt-1 text-xs text-ink-500">
                  {seller.city}, {seller.state}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <Rating value={seller.rating} count={seller.reviewCount} />
                </div>
                <p className="mt-3 text-xs font-semibold text-brand-700">
                  {pluralize(sellerCounts.get(seller.id) ?? 0, dict.seller.productCountOne, dict.seller.productCount)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="container-page py-14">
        <div className="flex flex-col items-start gap-6 rounded-card border border-brand-200 bg-brand-50 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {dict.home.sellTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{dict.home.sellBody}</p>
          </div>
          <Link
            href={href(locale, "/sell")}
            className="shrink-0 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {dict.home.sellCta}
          </Link>
        </div>
      </section>
    </>
  );
}
