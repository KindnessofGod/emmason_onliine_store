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
  return { title: getDictionary(locale).info.privacyTitle };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <InfoPage
      locale={locale}
      dict={dict}
      title={dict.info.privacyTitle}
      body={dict.info.privacyBody}
    />
  );
}
