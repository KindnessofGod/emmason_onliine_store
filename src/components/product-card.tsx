import Link from "next/link";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImage } from "./product-image";
import { ConditionBadge, Rating, SaleBadge } from "./ui";
import { discountPercent, formatPrice } from "@/lib/format";
import { href, interpolate, type Dictionary, type Locale } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  locale,
  dict,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
}) {
  const seller = product.sellerSlug
    ? { slug: product.sellerSlug, name: product.sellerName }
    : null;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const productHref = href(locale, `/product/${product.slug}`);

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-ink-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={productHref} className="relative block" tabIndex={-1} aria-hidden="true">
        <ProductImage
          categorySlug={product.categorySlug}
          name={product.name}
          src={product.images[0]}
          className="aspect-[4/3] w-full"
        />
        {discount !== null && (
          <span className="absolute left-3 top-3">
            <SaleBadge label={interpolate(dict.product.save, { percent: discount })} />
          </span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {interpolate(dict.product.lowStock, { count: product.stock })}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <ConditionBadge condition={product.condition} dict={dict} />
          <Rating value={product.rating} count={product.reviewCount} className="ml-auto" />
        </div>

        <h3 className="text-[15px] font-bold leading-snug text-ink-900">
          <Link href={productHref} className="transition group-hover:text-brand-700">
            {product.name}
          </Link>
        </h3>

        {seller && (
          <p className="mt-1 text-xs text-ink-500">
            {dict.cart.soldByShort}{" "}
            <Link
              href={href(locale, `/seller/${seller.slug}`)}
              className="font-semibold text-ink-600 transition hover:text-brand-700"
            >
              {seller.name}
            </Link>
          </p>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-ink-900">
            {formatPrice(product.price, locale)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-ink-400 line-through">
              {formatPrice(product.compareAtPrice, locale)}
            </span>
          )}
        </div>

        <div className="mt-4 pt-0">
          <AddToCartButton
            productId={product.id}
            stock={product.stock}
            size="sm"
            labels={{
              add: dict.product.addToCart,
              added: dict.product.added,
              outOfStock: dict.product.outOfStock,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  locale,
  dict,
}: {
  products: Product[];
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} dict={dict} />
      ))}
    </div>
  );
}
