import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { getOrderByReference } from "@/lib/orders";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; error?: string }>;
}) {
  const { error } = await searchParams;

  async function lookup(formData: FormData) {
    "use server";

    const reference = String(formData.get("reference") ?? "")
      .trim()
      .toUpperCase();

    if (!reference) redirect("/track?error=empty");

    const order = await getOrderByReference(reference);
    if (!order) redirect("/track?error=notfound");

    redirect(`/order/${order.reference}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Track your order</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the reference from your confirmation, for example EMM-7F3K2Q.
      </p>

      <form action={lookup} className="mt-6">
        <label htmlFor="reference" className="sr-only">
          Order reference
        </label>
        <div className="flex gap-2">
          <input
            id="reference"
            name="reference"
            required
            placeholder="EMM-XXXXXX"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Search className="size-4" aria-hidden />
            Find
          </button>
        </div>
      </form>

      {error === "notfound" && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          We could not find an order with that reference. Check it and try again.
        </p>
      )}
      {error === "empty" && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          Please enter a reference.
        </p>
      )}
    </div>
  );
}
