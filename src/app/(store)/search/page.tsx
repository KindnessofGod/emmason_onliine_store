import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { whatsAppEnquiryLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const products = term ? await searchProducts(term) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-brand-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Search</span>
      </nav>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {term ? `Results for “${term}”` : "Search the store"}
      </h1>

      {term && (
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "match" : "matches"}
        </p>
      )}

      {term && products.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <p className="font-medium">Nothing matched “{term}”.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a shorter word, or ask us directly — we may have it in stock
            without it being listed yet.
          </p>
          <a
            href={whatsAppEnquiryLink(term)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ask about “{term}” on WhatsApp
          </a>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
