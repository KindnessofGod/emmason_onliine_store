import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage } from "@/components/info-page";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).info.faqTitle };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const entries = [
    { q: dict.info.q1, a: dict.info.a1 },
    { q: dict.info.q2, a: dict.info.a2 },
    { q: dict.info.q3, a: dict.info.a3 },
    { q: dict.info.deliveryTitle, a: dict.info.deliveryBody },
    { q: dict.info.returnsTitle, a: dict.info.returnsBody },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };

  return (
    <InfoPage locale={locale} dict={dict} title={dict.info.faqTitle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <dl className="mt-8 space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.q}
            className="rounded-card border border-ink-100 bg-white p-6 shadow-soft"
          >
            <dt className="font-extrabold text-ink-900">{entry.q}</dt>
            <dd className="mt-2 leading-relaxed text-ink-600">{entry.a}</dd>
          </div>
        ))}
      </dl>
    </InfoPage>
  );
}
