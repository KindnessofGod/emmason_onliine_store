import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuyBox } from "@/components/product-buy-box";
import { ProductImage } from "@/components/product-image";
import { PinIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import {
  Breadcrumbs,
  ConditionBadge,
  Rating,
  SaleBadge,
  SectionHeading,
  VerifiedBadge,
} from "@/components/ui";
import {
  allProducts,
  getCategory,
  getProduct,
  getSeller,
  relatedProducts,
} from "@/lib/data";
import { discountPercent, formatPrice } from "@/lib/format";
import { getDictionary, href, interpolate, isLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  const products = await allProducts();
  return locales.flatMap((locale) => products.map((product) => ({ locale, slug: product.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description[locale],
    openGraph: { title: product.name, description: product.description[locale] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const product = await getProduct(slug);
  if (!product) notFound();

  const dict = getDictionary(locale);
  const [category, seller, related] = await Promise.all([
    getCategory(product.categorySlug),
    getSeller(product.sellerId),
    relatedProducts(product, 4),
  ]);
  const discount = discountPercent(product.price, product.compareAtPrice);

  // Search engines read this even though the storefront is not transactional yet.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description[locale],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "NGN",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: seller?.name ?? site.legalName },
    },
  };

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: href(locale) },
          { label: dict.shop.title, href: href(locale, "/shop") },
          ...(category
            ? [
                {
                  label: category.name[locale],
                  href: href(locale, `/category/${category.slug}`),
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-card">
            <ProductImage
              categorySlug={product.categorySlug}
              name={product.name}
              size="hero"
              className="aspect-square w-full"
            />
            {discount !== null && (
              <span className="absolute left-4 top-4">
                <SaleBadge label={interpolate(dict.product.save, { percent: discount })} />
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`overflow-hidden rounded-xl ${
                  index === 0 ? "ring-2 ring-brand-500" : "opacity-70"
                }`}
              >
                <ProductImage
                  categorySlug={product.categorySlug}
                  name={product.name}
                  size="thumb"
                  className="aspect-square w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Buy column */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ConditionBadge condition={product.condition} dict={dict} />
            <span className="text-xs font-semibold text-ink-400">{product.brand}</span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Rating value={product.rating} count={product.reviewCount} />
            {product.stock > 0 ? (
              <span className="text-sm font-semibold text-brand-700">
                {product.stock <= 5
                  ? interpolate(dict.product.lowStock, { count: product.stock })
                  : dict.product.inStock}
              </span>
            ) : (
              <span className="text-sm font-semibold text-flash-500">
                {dict.product.outOfStock}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-ink-900">
              {formatPrice(product.price, locale)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-ink-400 line-through">
                {formatPrice(product.compareAtPrice, locale)}
              </span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-ink-600">{product.description[locale]}</p>

          {seller && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-800">
                {seller.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-500">{dict.product.soldBy}</p>
                <Link
                  href={href(locale, `/seller/${seller.slug}`)}
                  className="block truncate text-sm font-bold text-ink-900 transition hover:text-brand-700"
                >
                  {seller.name}
                </Link>
              </div>
              {seller.verified && <VerifiedBadge label={dict.product.verified} />}
            </div>
          )}

          <ProductBuyBox
            productId={product.id}
            stock={product.stock}
            labels={{
              add: dict.product.addToCart,
              added: dict.product.added,
              outOfStock: dict.product.outOfStock,
              quantity: dict.product.quantity,
              buyNow: dict.product.buyNow,
            }}
            cartHref={href(locale, "/cart")}
          />

          <ul className="mt-7 space-y-3 border-t border-ink-100 pt-6">
            <li className="flex gap-3 text-sm">
              <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span className="text-ink-600">{dict.product.deliveryBody}</span>
            </li>
            <li className="flex gap-3 text-sm">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span className="text-ink-600">
                {interpolate(dict.product.warrantyMonths, { count: product.warrantyMonths })}
              </span>
            </li>
            <li className="flex gap-3 text-sm">
              <StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span className="text-ink-600">
                {dict.home.trustPickup} — {site.address.line1}, {site.address.city}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Specifications */}
      <section className="mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
          {dict.product.specifications}
        </h2>
        <dl className="mt-5 overflow-hidden rounded-card border border-ink-100">
          {product.specs.map((spec, index) => (
            <div
              key={spec.label.en}
              className={`grid grid-cols-[minmax(9rem,1fr)_2fr] gap-4 px-5 py-3.5 text-sm ${
                index % 2 === 0 ? "bg-ink-50/60" : "bg-white"
              }`}
            >
              <dt className="font-semibold text-ink-600">{spec.label[locale]}</dt>
              <dd className="text-ink-900">{spec.value}</dd>
            </div>
          ))}
          <div
            className={`grid grid-cols-[minmax(9rem,1fr)_2fr] gap-4 px-5 py-3.5 text-sm ${
              product.specs.length % 2 === 0 ? "bg-ink-50/60" : "bg-white"
            }`}
          >
            <dt className="font-semibold text-ink-600">{dict.product.warranty}</dt>
            <dd className="text-ink-900">
              {interpolate(dict.product.warrantyMonths, { count: product.warrantyMonths })}
            </dd>
          </div>
        </dl>
      </section>

      {/* Delivery & pickup */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-ink-100 p-6">
          <TruckIcon className="h-6 w-6 text-brand-600" />
          <h3 className="mt-3 font-extrabold text-ink-900">{dict.checkout.deliveryOption}</h3>
          <p className="mt-1.5 text-sm text-ink-600">{dict.checkout.deliveryBody}</p>
        </div>
        <div className="rounded-card border border-ink-100 p-6">
          <PinIcon className="h-6 w-6 text-brand-600" />
          <h3 className="mt-3 font-extrabold text-ink-900">{dict.checkout.pickup}</h3>
          <p className="mt-1.5 text-sm text-ink-600">{dict.checkout.pickupBody}</p>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading title={dict.product.related} />
          <ProductGrid products={related} locale={locale} dict={dict} />
        </section>
      )}
    </div>
  );
}
