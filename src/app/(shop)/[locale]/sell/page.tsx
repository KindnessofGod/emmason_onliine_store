import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRightIcon,
  ShieldIcon,
  SparkIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/icons";
import { Rating, VerifiedBadge } from "@/components/ui";
import { productCountBySeller, verifiedSellers } from "@/lib/data";
import { getDictionary, href, interpolate, pluralize, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.seller.landingTitle, description: dict.seller.landingSubtitle };
}

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const benefits = [
    {
      icon: <StoreIcon className="h-6 w-6" />,
      title: dict.seller.benefit1Title,
      body: dict.seller.benefit1Body,
    },
    {
      icon: <SparkIcon className="h-6 w-6" />,
      title: dict.seller.benefit2Title,
      body: dict.seller.benefit2Body,
    },
    {
      icon: <TruckIcon className="h-6 w-6" />,
      title: dict.seller.benefit3Title,
      body: dict.seller.benefit3Body,
    },
  ];

  const steps = [
    { title: dict.seller.step1, body: dict.seller.step1Body },
    { title: dict.seller.step2, body: dict.seller.step2Body },
    { title: dict.seller.step3, body: dict.seller.step3Body },
  ];

  const sellers = await verifiedSellers();

  // JSX cannot await inside a .map(), so resolve the listing counts up front.
  const sellerCounts = new Map(
    (await Promise.all(sellers.map((seller) => productCountBySeller(seller.id)))).map(
      (count, index) => [sellers[index].id, count] as const,
    ),
  );

  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <svg
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path d="M0 260 Q300 190 600 240 T1200 210 V400 H0 Z" fill="#397418" fillOpacity="0.7" />
          <path d="M0 320 Q320 255 640 300 T1200 275 V400 H0 Z" fill="#4a951a" fillOpacity="0.5" />
        </svg>
        <div className="container-page relative py-16 lg:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-300">
            <ShieldIcon className="h-3.5 w-3.5" />
            {dict.home.sellersSubtitle}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            {dict.seller.landingTitle}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            {dict.seller.landingSubtitle}
          </p>
          <Link
            href={href(locale, "/sell/register")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-bold text-white transition hover:bg-brand-400"
          >
            {dict.seller.registerCta}
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-card border border-ink-100 bg-white p-6 shadow-soft"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                {benefit.icon}
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-ink-900">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/70 py-14">
        <div className="container-page">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {dict.seller.howTitle}
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-extrabold text-ink-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.body}</p>
              </li>
            ))}
          </ol>
          <Link
            href={href(locale, "/sell/register")}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white transition hover:bg-brand-700"
          >
            {dict.seller.registerCta}
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          {dict.home.sellersTitle}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={href(locale, `/seller/${seller.slug}`)}
              className="flex flex-col rounded-card border border-ink-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-800">
                  {seller.name.charAt(0)}
                </span>
                <VerifiedBadge label={dict.product.verified} />
              </div>
              <h3 className="mt-3 text-sm font-extrabold leading-snug text-ink-900">
                {seller.name}
              </h3>
              <p className="mt-1 text-xs text-ink-500">
                {interpolate(dict.seller.memberSince, { year: seller.since })}
              </p>
              <div className="mt-3">
                <Rating value={seller.rating} count={seller.reviewCount} />
              </div>
              <p className="mt-3 text-xs font-semibold text-brand-700">
                {pluralize(sellerCounts.get(seller.id) ?? 0, dict.seller.productCountOne, dict.seller.productCount)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
