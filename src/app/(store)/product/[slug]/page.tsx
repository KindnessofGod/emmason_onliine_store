import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { discountPercent, formatNaira } from "@/lib/money";
import { ProductImage } from "@/components/product-image";
import { ProductCard } from "@/components/product-card";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { whatsAppEnquiryLink } from "@/lib/whatsapp";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images.length > 0 ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id);
  const discount = discountPercent(product.price_kobo, product.compare_at_price_kobo);
  const specs = Object.entries(product.specs ?? {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* self-start: without it the grid stretches this card to match the
            taller details column, leaving a gap under the square image. */}
        <div className="self-start overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-square">
            <ProductImage images={product.images} name={product.name} large />
            {discount !== null && (
              <span className="absolute left-4 top-4 rounded-full bg-accent-600 px-3 py-1 text-sm font-semibold text-white">
                Save {discount}%
              </span>
            )}
          </div>
        </div>

        <div>
          {product.brand && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {product.brand}
            </p>
          )}

          <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-700 dark:text-brand-300">
              {formatNaira(product.price_kobo)}
            </span>
            {product.compare_at_price_kobo && (
              <span className="text-lg text-muted-foreground line-through">
                {formatNaira(product.compare_at_price_kobo)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm">
            {product.stock === 0 ? (
              <span className="font-medium text-red-600">Out of stock</span>
            ) : product.stock <= 5 ? (
              <span className="font-medium text-accent-600">
                Only {product.stock} left in stock
              </span>
            ) : (
              <span className="font-medium text-brand-600 dark:text-brand-300">
                In stock
              </span>
            )}
          </p>

          {product.description && (
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <ProductPurchasePanel
            productId={product.id}
            productName={product.name}
            stock={product.stock}
          />

          <div className="mt-6 space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex gap-3">
              <Truck className="size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
              <p>Delivered nationwide. Fee is calculated at checkout by state.</p>
            </div>
            {product.warranty_months ? (
              <div className="flex gap-3">
                <ShieldCheck className="size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                <p>{product.warranty_months} months warranty on this item.</p>
              </div>
            ) : null}
            <div className="flex gap-3">
              <MessageCircle className="size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
              <p>
                Not sure?{" "}
                <a
                  href={whatsAppEnquiryLink(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 underline dark:text-brand-300"
                >
                  Ask us about this on WhatsApp
                </a>
                .
              </p>
            </div>
          </div>

          {specs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Specifications
              </h2>
              <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex gap-4 bg-card px-4 py-2.5 text-sm">
                    <dt className="w-2/5 shrink-0 text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.sku && (
            <p className="mt-4 text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">
            More in {product.category.name}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
