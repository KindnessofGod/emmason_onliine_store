import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerRegistrationForm } from "@/components/seller-registration-form";
import { Breadcrumbs } from "@/components/ui";
import { getCategories } from "@/lib/data";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { nigerianStates } from "@/lib/nigeria";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.seller.registerTitle, description: dict.seller.registerSubtitle };
}

export default async function SellerRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs
          items={[
            { label: dict.nav.home, href: href(locale) },
            { label: dict.nav.sell, href: href(locale, "/sell") },
            { label: dict.seller.registerTitle },
          ]}
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {dict.seller.registerTitle}
        </h1>
        <p className="mt-2 text-ink-500">{dict.seller.registerSubtitle}</p>

        <div className="mt-8">
          <SellerRegistrationForm
            locale={locale}
            dict={dict}
            categories={await getCategories()}
            states={[...nigerianStates]}
          />
        </div>
      </div>
    </div>
  );
}
