import Link from "next/link";
import { MessageCircle, ShieldCheck, Truck, Wallet } from "lucide-react";
import {
  getCategories,
  getCategoryProductCounts,
  getFeaturedProducts,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { whatsAppEnquiryLink } from "@/lib/whatsapp";
import { storeConfig } from "@/lib/store-config";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, counts, featured] = await Promise.all([
    getCategories(),
    getCategoryProductCounts(),
    getFeaturedProducts(10),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 to-brand-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">
              Nationwide delivery
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
              Gadgets, sound and home essentials — without the market trek.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              Power banks that survive the outage, speakers loud enough for the
              compound, clippers the barbers actually use. Pay by card or finish
              your order on WhatsApp — whichever you trust more.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#categories"
                className="rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-accent-400"
              >
                Start shopping
              </Link>
              <a
                href={whatsAppEnquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                <MessageCircle className="size-4" aria-hidden />
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Delivered nationwide", body: "All 36 states and the FCT, 1-7 working days." },
            { icon: Wallet, title: "Pay your way", body: "Card, transfer or USSD — or arrange it on WhatsApp." },
            { icon: ShieldCheck, title: "Warranty honoured", body: "Boxed items carry up to 12 months cover." },
            { icon: MessageCircle, title: "We answer", body: "A real person on WhatsApp, not a bot." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <Icon className="size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sixteen categories, everything in stock ready to ship.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group rounded-xl border border-border bg-card p-4 transition hover:border-brand-400 hover:shadow-md"
            >
              <p className="font-semibold leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-300">
                {category.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {counts[category.id] ?? 0}{" "}
                {(counts[category.id] ?? 0) === 1 ? "product" : "products"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular right now</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                What people are actually buying from {storeConfig.name}.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
