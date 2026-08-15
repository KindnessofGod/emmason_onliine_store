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
  return { title: getDictionary(locale).info.returnsTitle };
}

export default async function ReturnsPage({
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
      title={dict.info.returnsTitle}
      body={dict.info.returnsBody}
    />
  );
}
