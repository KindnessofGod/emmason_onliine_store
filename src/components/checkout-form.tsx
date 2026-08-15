"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { hydrateCart, type HydratedCart } from "@/actions/cart";
import { submitCheckout } from "@/actions/checkout";
import { formatNaira } from "@/lib/money";
import type { DeliveryZone, OrderChannel } from "@/lib/types";

const EMPTY: HydratedCart = {
  lines: [],
  subtotalKobo: 0,
  removedCount: 0,
  adjusted: [],
};

export function CheckoutForm({ zones }: { zones: DeliveryZone[] }) {
  const router = useRouter();
  const { lines, ready, clear } = useCart();

  const [priced, setPriced] = useState<HydratedCart | null>(null);
  const [channel, setChannel] = useState<OrderChannel>("paystack");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready || lines.length === 0) return;

    let cancelled = false;
    void hydrateCart(lines).then((result) => {
      if (!cancelled) setPriced(result);
    });

    return () => {
      cancelled = true;
    };
  }, [lines, ready]);

  const isEmpty = ready && lines.length === 0;
  const cart = isEmpty ? EMPTY : priced;

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.state === state) ?? null,
    [zones, state],
  );

  const deliveryFee = selectedZone?.fee_kobo ?? 0;
  const subtotal = cart?.subtotalKobo ?? 0;
  const total = subtotal + deliveryFee;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart) return;

    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitCheckout({
        channel,
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? ""),
        deliveryAddress: String(formData.get("deliveryAddress") ?? ""),
        deliveryState: String(formData.get("deliveryState") ?? ""),
        deliveryCity: String(formData.get("deliveryCity") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        items: cart.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      // The order now exists server-side, so the local cart has served its
      // purpose either way.
      clear();

      if (result.channel === "paystack") {
        window.location.href = result.redirectUrl;
      } else {
        // Open WhatsApp in a new tab, then show the confirmation page here.
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
        router.push(`/order/${result.reference}`);
      }
    });
  }

  if (!cart) {
    return (
      <div className="mt-8 h-64 animate-pulse rounded-xl border border-border bg-card" />
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <p className="font-medium">There is nothing to check out.</p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-accent-400"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        {/* Contact */}
        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">Your details</legend>

          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="customerName"
              required
              autoComplete="name"
              errors={fieldErrors.customerName}
            />
            <Field
              label="Phone number"
              name="customerPhone"
              type="tel"
              required
              placeholder="0801 234 5678"
              autoComplete="tel"
              errors={fieldErrors.customerPhone}
            />
            <div className="sm:col-span-2">
              <Field
                label={
                  channel === "paystack" ? "Email address" : "Email address (optional)"
                }
                name="customerEmail"
                type="email"
                required={channel === "paystack"}
                autoComplete="email"
                hint={
                  channel === "paystack"
                    ? "Your payment receipt is sent here."
                    : undefined
                }
                errors={fieldErrors.customerEmail}
              />
            </div>
          </div>
        </fieldset>

        {/* Delivery */}
        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">Delivery</legend>

          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="deliveryAddress"
                className="block text-sm font-medium"
              >
                Street address <span className="text-red-600">*</span>
              </label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                required
                rows={3}
                autoComplete="street-address"
                placeholder="House number, street, area, nearest landmark"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {fieldErrors.deliveryAddress?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.deliveryAddress[0]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="deliveryState" className="block text-sm font-medium">
                State <span className="text-red-600">*</span>
              </label>
              <select
                id="deliveryState"
                name="deliveryState"
                required
                value={state}
                onChange={(event) => setState(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Select a state…</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.state}>
                    {zone.state} — {formatNaira(zone.fee_kobo)}
                  </option>
                ))}
              </select>
              {selectedZone && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Arrives in {selectedZone.eta_days}.
                </p>
              )}
            </div>

            <Field
              label="Town or city"
              name="deliveryCity"
              autoComplete="address-level2"
              errors={fieldErrors.deliveryCity}
            />

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium">
                Delivery note <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Anything the dispatch rider should know"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </fieldset>

        {/* Payment method */}
        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">How would you like to pay?</legend>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ChannelOption
              selected={channel === "paystack"}
              onSelect={() => setChannel("paystack")}
              icon={<CreditCard className="size-5" aria-hidden />}
              title="Pay now with Paystack"
              body="Card, bank transfer or USSD. Your order is confirmed immediately."
            />
            <ChannelOption
              selected={channel === "whatsapp"}
              onSelect={() => setChannel("whatsapp")}
              icon={<MessageCircle className="size-5" aria-hidden />}
              title="Order on WhatsApp"
              body="We save your order and open a chat with the details filled in. Pay on delivery or by transfer."
            />
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-32">
        <h2 className="font-semibold">Order summary</h2>

        <ul className="mt-4 space-y-2 text-sm">
          {cart.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {line.quantity} × {line.product.name}
              </span>
              <span className="shrink-0 font-medium">
                {formatNaira(line.lineTotalKobo)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-medium">
              {selectedZone ? formatNaira(deliveryFee) : "Select a state"}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-700 dark:text-brand-300">
              {formatNaira(total)}
            </span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !selectedZone}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending
            ? "Placing order…"
            : channel === "paystack"
              ? `Pay ${formatNaira(total)}`
              : "Send order on WhatsApp"}
        </button>

        {!selectedZone && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Choose your state to see the delivery fee.
          </p>
        )}
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
  hint,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {hint && !errors?.[0] && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {errors?.[0] && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
    </div>
  );
}

function ChannelOption({
  selected,
  onSelect,
  icon,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600 dark:bg-brand-900"
          : "border-border hover:border-brand-400"
      }`}
    >
      <span className="flex items-center gap-2 font-medium">
        {icon}
        {title}
      </span>
      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
        {body}
      </span>
    </button>
  );
}
