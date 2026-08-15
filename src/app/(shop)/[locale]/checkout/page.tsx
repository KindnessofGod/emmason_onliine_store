import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { allProducts } from "@/lib/data";
import { getDictionary, isLocale } from "@/lib/i18n";
import { nigerianStates } from "@/lib/nigeria";
import { site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).checkout.title };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
        {dict.checkout.title}
      </h1>
      <CheckoutForm
        locale={locale}
        dict={dict}
        catalogue={await allProducts()}
        states={[...nigerianStates]}
        deliveryFee={site.deliveryFee}
        freeDeliveryThreshold={site.freeDeliveryThreshold}
      />
    </div>
  );
}
