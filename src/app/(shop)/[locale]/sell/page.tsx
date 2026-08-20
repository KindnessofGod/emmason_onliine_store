import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GlobeIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { WholesaleForm } from "@/components/wholesale-form";
import { getDictionary, isLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.wholesale.landingTitle, description: dict.wholesale.landingSubtitle };
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
      icon: <TruckIcon className="h-6 w-6" />,
      title: dict.wholesale.benefit1Title,
      body: dict.wholesale.benefit1Body,
    },
    {
      icon: <SparkIcon className="h-6 w-6" />,
      title: dict.wholesale.benefit2Title,
      body: dict.wholesale.benefit2Body,
    },
    {
      icon: <WhatsAppIcon className="h-6 w-6" />,
      title: dict.wholesale.benefit3Title,
      body: dict.wholesale.benefit3Body,
    },
  ];

  const steps = [
    { title: dict.wholesale.step1, body: dict.wholesale.step1Body },
    { title: dict.wholesale.step2, body: dict.wholesale.step2Body },
    { title: dict.wholesale.step3, body: dict.wholesale.step3Body },
  ];

  const fullAddress = `${site.address.line1}, ${site.address.line2}, ${site.address.city}, ${site.address.state}, ${site.address.country}`;
  const mapsSearchHref = `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

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
        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-300">
              <ShieldIcon className="h-3.5 w-3.5" />
              {dict.wholesale.eyebrow}
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              {dict.wholesale.landingTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              {dict.wholesale.landingSubtitle}
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <li className="flex items-center gap-2 text-sm font-semibold text-brand-200">
                <TruckIcon className="h-4 w-4 shrink-0" />
                {dict.wholesale.reachNigeria}
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-brand-200">
                <GlobeIcon className="h-4 w-4 shrink-0" />
                {dict.wholesale.reachAfrica}
              </li>
            </ul>
          </div>

          <div className="rounded-card bg-white p-6 shadow-lift sm:p-8">
            <WholesaleForm locale={locale} dict={dict} source="page" />
          </div>
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
            {dict.wholesale.howTitle}
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
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {dict.footer.walkIn}
            </h2>
            <address className="mt-5 flex gap-3 not-italic">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span className="text-sm leading-relaxed text-ink-600">
                <strong className="font-bold text-ink-900">{site.address.line1}</strong>
                <br />
                {site.address.line2}
                <br />
                {site.address.city}, {site.address.state}, {site.address.country}
                <br />
                <span className="text-ink-400">{dict.footer.hours}</span>
              </span>
            </address>
            <a
              href={mapsSearchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              {dict.home.storeCta}
            </a>
          </div>

          <div className="overflow-hidden rounded-card border border-ink-100 shadow-soft">
            <iframe
              src={mapsEmbedSrc}
              title={site.address.line1}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full lg:h-full lg:min-h-[280px]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
