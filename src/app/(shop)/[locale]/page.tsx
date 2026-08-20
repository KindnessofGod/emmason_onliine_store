import Image from "next/image";
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
import { Rating, SaleBadge, SectionHeading, VerifiedBadge } from "@/components/ui";
import { discountPercent, formatPrice } from "@/lib/format";
import {
  getCategories,
  newArrivals,
  onSaleProducts,
  productCountByCategory,
  productCountBySeller,
  verifiedSellers,
} from "@/lib/data";
import { getDictionary, href, interpolate, pluralize, isLocale } from "@/lib/i18n";
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

  const totalProducts = Array.from(categoryCounts.values()).reduce((sum, n) => sum + n, 0);
  // Deepest discount first, so the tall featured hero tile carries the
  // single best real deal rather than whatever sorted first from the query.
  const heroDeals = [...deals]
    .sort((a, b) => (discountPercent(b.price, b.compareAtPrice) ?? 0) - (discountPercent(a.price, a.compareAtPrice) ?? 0))
    .slice(0, 3);

  return (
    <>
      {/* Hero
          Real product photography now exists for the whole catalogue, and
          research on electronics/marketplace hero sections (Konga, oraimo,
          general ecommerce conversion data) points the same direction: real
          product shots with visible price/discount outperform abstract
          brand imagery, and the "featured big tile + smaller tiles" bento
          arrangement is the current standard for showing several real
          products at once without a slow, data-heavy carousel. Unlike the
          old collage, this renders on mobile too — it was `hidden lg:block`
          before, so phones (most of this traffic) never saw a product photo
          in the hero at all. */}
      <section className="relative overflow-hidden bg-brand-700">
        {/* A real, genuinely joyful photo — not stock-library filler — sits
            behind the whole hero at every breakpoint, not just on desktop.
            Full colour, no duotone treatment: an earlier attempt to blend a
            photo into the brand via grayscale + multiply was rejected as the
            wrong call, and this photo's own warm sage backdrop already sits
            close enough to the brand green that it doesn't need one. A
            gradient scrim protects the headline; the right side, where the
            deal tiles float on top, is left brighter. */}
        <Image
          src="https://kdpbuuaibwqktqdwzayu.supabase.co/storage/v1/object/public/product-images/site/hero-lifestyle-headphones.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none object-cover object-[68%_28%] sm:object-[72%_center] lg:object-[80%_center]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-900/75 via-brand-900/25 to-transparent lg:bg-gradient-to-r lg:from-brand-900/80 lg:via-brand-800/35 lg:to-transparent"
        />

        <div className="container-page relative grid items-start gap-10 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
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

            {/* A real number, not a marketing flourish — both counts come
                straight from the same queries already run for this page. */}
            {totalProducts > 0 && (
              <p className="mt-4 text-sm font-semibold text-brand-100">
                {interpolate(dict.home.heroStat, { products: totalProducts, sellers: sellers.length })}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
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

          {/* Deal bento — the single best discount gets the tall featured
              tile; the next two sit beside/below it. Every tile carries the
              real price and, where genuine, the real saving, the same
              honest-persuasion rule the rest of the storefront follows. */}
          {heroDeals.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-rows-2">
              {heroDeals.map((product, index) => {
                const discount = discountPercent(product.price, product.compareAtPrice);
                const featured = index === 0;
                return (
                  <Link
                    key={product.id}
                    href={href(locale, `/product/${product.slug}`)}
                    className={`group relative overflow-hidden rounded-2xl shadow-lift transition hover:-translate-y-1 ${
                      featured ? "col-span-2 lg:col-span-1 lg:row-span-2" : "col-span-1"
                    }`}
                  >
                    <ProductImage
                      categorySlug={product.categorySlug}
                      name={product.name}
                      src={product.images[0]}
                      className={featured ? "aspect-[4/3] w-full lg:aspect-[3/4]" : "aspect-square w-full"}
                      priority={featured}
                    />
                    {discount !== null && (
                      <span className="absolute left-3 top-3">
                        <SaleBadge label={interpolate(dict.product.save, { percent: discount })} />
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 via-ink-900/25 to-transparent p-3 pt-10">
                      <p className="truncate text-xs font-semibold text-white/90">{product.name}</p>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span
                          className={`font-extrabold text-white ${featured ? "text-lg" : "text-sm"}`}
                        >
                          {formatPrice(product.price, locale)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-[11px] text-white/60 line-through">
                            {formatPrice(product.compareAtPrice, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
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
              className="group relative overflow-hidden rounded-card text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              {/* A real photo of something the category actually sells,
                  chosen by hand — not the glyph-on-gradient tile the shop
                  owner asked to move away from. That tile is the fallback
                  for a category that hasn't had one picked yet, not the
                  default look. */}
              <div className="relative aspect-[4/3] w-full">
                {category.showcaseImage ? (
                  <Image
                    src={category.showcaseImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(145deg, ${category.gradient[0]} 0%, ${category.gradient[1]} 100%)`,
                      }}
                    />
                    <span className="absolute left-5 top-5 text-3xl" aria-hidden="true">
                      {category.glyph}
                    </span>
                  </>
                )}
                {/* Scrim keeps the white copy legible over any photo or gradient. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink-950/85 to-transparent"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-base font-extrabold leading-tight">{category.name[locale]}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-white/85">{category.tagline[locale]}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-bold">
                  {pluralize(categoryCounts.get(category.slug) ?? 0, dict.seller.productCountOne, dict.seller.productCount)}
                  <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
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
