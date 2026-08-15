import type { Metadata } from "next";
import { getDeliveryZones } from "@/lib/catalog";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const zones = await getDeliveryZones();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pay by card, transfer or USSD — or send the order to us on WhatsApp and
        settle it there.
      </p>
      <CheckoutForm zones={zones} />
    </div>
  );
}
