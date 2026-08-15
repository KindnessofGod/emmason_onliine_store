import Link from "next/link";
import { discountPercent, formatNaira } from "@/lib/money";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product.price_kobo, product.compare_at_price_kobo);
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-lg">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden"
      >
        <ProductImage
          images={product.images}
          name={product.name}
          className="transition duration-300 group-hover:scale-105"
        />

        {discount !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-accent-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}

        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
        )}

        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-brand-600"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-brand-700 dark:text-brand-300">
              {formatNaira(product.price_kobo)}
            </span>
            {product.compare_at_price_kobo && (
              <span className="text-xs text-muted-foreground line-through">
                {formatNaira(product.compare_at_price_kobo)}
              </span>
            )}
          </div>

          {lowStock && (
            <p className="mt-1 text-xs font-medium text-accent-600">
              Only {product.stock} left
            </p>
          )}

          <AddToCartButton
            productId={product.id}
            disabled={product.stock === 0}
            className="mt-2 w-full"
            compact
          />
        </div>
      </div>
    </div>
  );
}
