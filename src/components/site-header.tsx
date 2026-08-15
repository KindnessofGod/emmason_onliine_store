import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { getCategories } from "@/lib/catalog";
import { storeConfig } from "@/lib/store-config";
import { whatsAppEnquiryLink } from "@/lib/whatsapp";
import { CartBadge } from "@/components/cart-badge";
import { MobileNav } from "@/components/mobile-nav";

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 bg-brand-800 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <MobileNav categories={categories} />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent-500 font-bold text-brand-900">
            E
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            {storeConfig.name}
          </span>
        </Link>

        <form action="/search" className="relative flex-1 max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-800"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            placeholder="Search speakers, power banks, clippers…"
            aria-label="Search products"
            className="w-full rounded-lg border-0 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-900 placeholder:text-brand-800/50 focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </form>

        <a
          href={whatsAppEnquiryLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10 md:inline-flex"
        >
          <MessageCircle className="size-5" aria-hidden />
          WhatsApp
        </a>

        <CartBadge />
      </div>

      <nav className="hidden border-t border-white/10 lg:block">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="block whitespace-nowrap px-3 py-2.5 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
