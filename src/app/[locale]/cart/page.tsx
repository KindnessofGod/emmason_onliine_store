import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/components/cart-view";
import { allProducts } from "@/lib/data";
import { getDictionary, isLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).cart.title };
}

export default async function CartPage({
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
        {dict.cart.title}
      </h1>
      {/* The catalogue is handed down so the client cart can resolve ids without a fetch. */}
      <CartView
        locale={locale}
        dict={dict}
        catalogue={allProducts}
        deliveryFee={site.deliveryFee}
        freeDeliveryThreshold={site.freeDeliveryThreshold}
      />
    </div>
  );
}
