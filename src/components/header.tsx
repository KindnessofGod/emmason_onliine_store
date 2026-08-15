"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "./cart-provider";
import { CartIcon, CloseIcon, MenuIcon, PhoneIcon, SearchIcon, StoreIcon } from "./icons";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import type { Category } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { href } from "@/lib/i18n";
import { site } from "@/lib/site";

export function Header({
  locale,
  dict,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
}) {
  const router = useRouter();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function search(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `${href(locale, "/shop")}?q=${encodeURIComponent(q)}` : href(locale, "/shop"));
  }

  const navLinks = [
    { label: dict.nav.shop, path: "/shop" },
    { label: dict.nav.deals, path: "/deals" },
    { label: dict.nav.sell, path: "/sell" },
    { label: dict.nav.about, path: "/about" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
      {/* Announcement strip */}
      <div className="bg-brand-700 text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
          <p className="flex items-center gap-1.5 font-medium">
            <StoreIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {site.address.line1}, {site.address.city}
            </span>
          </p>
          <a
            href={`tel:${site.phones[0].replace(/\s/g, "")}`}
            className="flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            {site.phones[0]}
          </a>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={dict.nav.menu}
          className="-ml-2 rounded-lg p-2 text-ink-700 transition hover:bg-ink-100 lg:hidden"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <Link href={href(locale)} aria-label={site.name} className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={href(locale, link.path)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={search} role="search" className="ml-auto hidden max-w-sm flex-1 md:block">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.nav.search}
              aria-label={dict.nav.searchShort}
              className="field !pl-10"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />

          <Link
            href={href(locale, "/cart")}
            className="relative rounded-lg p-2.5 text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
            aria-label={dict.nav.cart}
          >
            <CartIcon className="h-[22px] w-[22px]" />
            {ready && count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-flash-500 px-1 text-[11px] font-bold leading-none text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category rail */}
      <div className="hidden border-t border-ink-100 lg:block">
        <div className="container-page flex h-11 items-center gap-1 overflow-x-auto">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={href(locale, `/category/${category.slug}`)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-800"
            >
              <span aria-hidden="true">{category.glyph}</span>
              {category.name[locale]}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={dict.nav.close}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink-900/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={dict.nav.close}
                className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form onSubmit={search} role="search" className="mb-5">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={dict.nav.search}
                    aria-label={dict.nav.searchShort}
                    className="field !pl-10"
                  />
                </div>
              </form>

              <nav className="space-y-0.5" aria-label="Mobile">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={href(locale, link.path)}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink-800 transition hover:bg-ink-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <p className="mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-wider text-ink-400">
                {dict.nav.categories}
              </p>
              <nav className="space-y-0.5" aria-label={dict.nav.categories}>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={href(locale, `/category/${category.slug}`)}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] text-ink-700 transition hover:bg-ink-100"
                  >
                    <span aria-hidden="true">{category.glyph}</span>
                    {category.name[locale]}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t border-ink-100 px-4 py-4">
              <a
                href={`tel:${site.phones[0].replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-sm font-semibold text-brand-700"
              >
                <PhoneIcon className="h-4 w-4" />
                {site.phones[0]}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
