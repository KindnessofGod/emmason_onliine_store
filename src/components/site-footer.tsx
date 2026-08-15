import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getCategories } from "@/lib/catalog";
import { formatWhatsAppNumber, storeConfig } from "@/lib/store-config";
import { whatsAppEnquiryLink } from "@/lib/whatsapp";

export async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className="mt-16 border-t border-border bg-brand-900 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent-500 font-bold text-brand-900">
              E
            </span>
            <span className="text-lg font-bold text-white">{storeConfig.name}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{storeConfig.tagline}</p>
          <a
            href={whatsAppEnquiryLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <MessageCircle className="size-4" aria-hidden />
            {formatWhatsAppNumber()}
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Shop
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.slice(0, 8).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="transition hover:text-accent-400"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            More categories
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.slice(8).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="transition hover:text-accent-400"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Ordering
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Pay by card, transfer or USSD via Paystack</li>
            <li>Or complete your order on WhatsApp</li>
            <li>Nationwide delivery, 1-7 working days</li>
            <li>Warranty honoured on all boxed items</li>
          </ul>
          <Link
            href="/track"
            className="mt-4 inline-block text-sm font-medium text-accent-400 hover:underline"
          >
            Track an order →
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} {storeConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
