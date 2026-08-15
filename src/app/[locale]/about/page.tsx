import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PinIcon, ShieldIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/ui";
import { allProducts, verifiedSellers } from "@/lib/data";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.footer.aboutUs, description: dict.meta.description };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const stats = [
    { value: `${allProducts.length}+`, label: dict.shop.title },
    { value: `${verifiedSellers().length}`, label: dict.home.sellersTitle },
    { value: "2016", label: dict.footer.walkIn },
    { value: "37", label: dict.checkout.state },
  ];

  const pillars = [
    { icon: <ShieldIcon className="h-6 w-6" />, label: dict.home.trustGuarantee },
    { icon: <TruckIcon className="h-6 w-6" />, label: dict.home.trustDelivery },
    { icon: <StoreIcon className="h-6 w-6" />, label: dict.home.trustPickup },
  ];

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[{ label: dict.nav.home, href: href(locale) }, { label: dict.footer.aboutUs }]}
      />

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {site.legalName}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-600">{dict.meta.description}</p>
        <p className="mt-4 leading-relaxed text-ink-600">{dict.home.storeBody}</p>
        <p className="mt-4 leading-relaxed text-ink-600">{dict.home.sellBody}</p>

        <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-card bg-brand-50 p-5 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-3xl font-extrabold text-brand-700">{stat.value}</span>
                <span className="mt-1 block text-xs font-semibold text-ink-600">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <li
              key={pillar.label}
              className="rounded-card border border-ink-100 p-5 text-center shadow-soft"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                {pillar.icon}
              </span>
              <p className="mt-3 text-sm font-bold text-ink-800">{pillar.label}</p>
            </li>
          ))}
        </ul>

        <section className="mt-12 rounded-card bg-ink-900 p-8 text-white">
          <h2 className="text-2xl font-extrabold">{dict.home.storeTitle}</h2>
          <address className="mt-4 flex gap-3 not-italic">
            <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
            <span className="text-sm leading-relaxed text-ink-200">
              <strong className="font-bold text-white">{site.address.line1}</strong>
              <br />
              {site.address.line2}
              <br />
              {site.address.city}, {site.address.state} · {dict.footer.hours}
            </span>
          </address>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={href(locale, "/contact")}
              className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400"
            >
              {dict.nav.contact}
            </Link>
            <Link
              href={href(locale, "/sell")}
              className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/20"
            >
              {dict.footer.sellWithUs}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
