"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { submitCheckout } from "@/actions/checkout";
import { useCart } from "./cart-provider";
import { CheckCircleIcon, PinIcon, TruckIcon } from "./icons";
import { ProductImage } from "./product-image";
import { EmptyState } from "./ui";
import { formatPrice } from "@/lib/format";
import { href, interpolate, type Dictionary, type Locale } from "@/lib/i18n";
import { isValidEmail, isValidNigerianPhone } from "@/lib/nigeria";
import type { FulfilmentMethod, PaymentMethod, Product } from "@/lib/types";
import { site } from "@/lib/site";

type FieldName = "fullName" | "phone" | "email" | "street" | "city" | "state";

export function CheckoutForm({
  locale,
  dict,
  catalogue,
  states,
  deliveryFee,
  freeDeliveryThreshold,
}: {
  locale: Locale;
  dict: Dictionary;
  catalogue: Product[];
  states: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
}) {
  const { lines, ready, clear } = useCart();

  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("delivery");
  const [payment, setPayment] = useState<PaymentMethod>("on-delivery");
  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    landmark: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [placed, setPlaced] = useState<{ reference: string; phone: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // The form is taller than the viewport, so without this the confirmation
  // renders above the shopper's scroll position and looks like a blank page.
  useEffect(() => {
    if (placed) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [placed]);

  const byId = useMemo(
    () => new Map(catalogue.map((product) => [product.id, product])),
    [catalogue],
  );
  const items = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = byId.get(line.productId);
        return product ? [{ product, quantity: line.quantity }] : [];
      }),
    [lines, byId],
  );

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const delivery =
    fulfilment === "pickup" || subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
  const total = subtotal + delivery;

  function set(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (field in errors) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field as FieldName];
        return next;
      });
    }
  }

  function validate(): boolean {
    const next: Partial<Record<FieldName, string>> = {};

    if (!values.fullName.trim()) next.fullName = dict.checkout.required;
    if (!values.phone.trim()) next.phone = dict.checkout.required;
    else if (!isValidNigerianPhone(values.phone)) next.phone = dict.checkout.invalidPhone;
    if (values.email.trim() && !isValidEmail(values.email))
      next.email = dict.checkout.invalidEmail;

    if (fulfilment === "delivery") {
      if (!values.street.trim()) next.street = dict.checkout.required;
      if (!values.city.trim()) next.city = dict.checkout.required;
      if (!values.state) next.state = dict.checkout.required;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) {
      // Send focus to the first problem so the shopper is not hunting for it.
      const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstError?.focus();
      firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSubmitError(null);

    startTransition(async () => {
      const result = await submitCheckout({
        fulfilment,
        payment,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        street: values.street,
        city: values.city,
        state: values.state,
        landmark: values.landmark,
        notes: values.notes,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        setSubmitError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // The order exists server-side now, so the local cart has done its job.
      clear();

      if (result.kind === "paystack") {
        window.location.href = result.redirectUrl;
        return;
      }

      // Transfer and pay-on-delivery are settled by hand: open the pre-filled
      // WhatsApp thread, then show the confirmation here.
      if (result.kind === "whatsapp") {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      setPlaced({ reference: result.reference, phone: values.phone });
    });
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <CheckCircleIcon className="h-9 w-9 text-brand-700" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold text-ink-900">
          {dict.checkout.successTitle}
        </h2>
        <p className="mt-3 leading-relaxed text-ink-600">
          {interpolate(dict.checkout.successBody, { phone: placed.phone })}
        </p>
        <p className="mt-6 inline-block rounded-xl bg-ink-50 px-5 py-3 text-sm">
          <span className="text-ink-500">{dict.checkout.orderNumber}: </span>
          <strong className="font-extrabold tracking-wide text-ink-900">{placed.reference}</strong>
        </p>
        <div className="mt-8">
          <Link
            href={href(locale, "/shop")}
            className="inline-block rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white transition hover:bg-brand-700"
          >
            {dict.checkout.backToShop}
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="h-96 animate-pulse rounded-card bg-ink-100" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={dict.cart.empty}
        action={
          <Link
            href={href(locale, "/shop")}
            className="inline-block rounded-xl bg-brand-600 px-6 py-3 font-bold text-white transition hover:bg-brand-700"
          >
            {dict.cart.emptyCta}
          </Link>
        }
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {/* Contact */}
        <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.checkout.contactSection}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              id="fullName"
              label={dict.checkout.fullName}
              value={values.fullName}
              error={errors.fullName}
              onChange={(v) => set("fullName", v)}
              autoComplete="name"
              required
            />
            <Field
              id="phone"
              label={dict.checkout.phone}
              value={values.phone}
              error={errors.phone}
              onChange={(v) => set("phone", v)}
              type="tel"
              autoComplete="tel"
              placeholder="0803 863 0197"
              required
            />
            <div className="sm:col-span-2">
              <Field
                id="email"
                label={`${dict.checkout.email} (${dict.common.optional})`}
                value={values.email}
                error={errors.email}
                onChange={(v) => set("email", v)}
                type="email"
                autoComplete="email"
              />
            </div>
          </div>
        </section>

        {/* Fulfilment */}
        <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">
            {dict.checkout.fulfilmentSection}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <OptionCard
              name="fulfilment"
              checked={fulfilment === "delivery"}
              onChange={() => setFulfilment("delivery")}
              icon={<TruckIcon className="h-5 w-5" />}
              title={dict.checkout.deliveryOption}
              body={dict.checkout.deliveryBody}
              meta={
                subtotal >= freeDeliveryThreshold
                  ? dict.cart.deliveryFree
                  : formatPrice(deliveryFee, locale)
              }
            />
            <OptionCard
              name="fulfilment"
              checked={fulfilment === "pickup"}
              onChange={() => setFulfilment("pickup")}
              icon={<PinIcon className="h-5 w-5" />}
              title={dict.checkout.pickup}
              body={dict.checkout.pickupBody}
              meta={dict.cart.deliveryFree}
            />
          </div>

          {fulfilment === "delivery" && (
            <div className="mt-6 border-t border-ink-100 pt-6">
              <h3 className="text-sm font-bold text-ink-900">{dict.checkout.addressSection}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    id="street"
                    label={dict.checkout.street}
                    value={values.street}
                    error={errors.street}
                    onChange={(v) => set("street", v)}
                    autoComplete="street-address"
                    required
                  />
                </div>
                <Field
                  id="city"
                  label={dict.checkout.city}
                  value={values.city}
                  error={errors.city}
                  onChange={(v) => set("city", v)}
                  autoComplete="address-level2"
                  required
                />
                <div>
                  <label htmlFor="state" className="field-label">
                    {dict.checkout.state} <span className="text-flash-500">*</span>
                  </label>
                  <select
                    id="state"
                    value={values.state}
                    onChange={(e) => set("state", e.target.value)}
                    aria-invalid={Boolean(errors.state)}
                    aria-describedby={errors.state ? "state-error" : undefined}
                    className="field"
                    autoComplete="address-level1"
                  >
                    <option value="">{dict.checkout.selectState}</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p id="state-error" className="mt-1.5 text-xs font-medium text-flash-500">
                      {errors.state}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Field
                    id="landmark"
                    label={dict.checkout.landmark}
                    value={values.landmark}
                    onChange={(v) => set("landmark", v)}
                  />
                </div>
              </div>
            </div>
          )}

          {fulfilment === "pickup" && (
            <address className="mt-6 flex gap-3 rounded-xl bg-brand-50 p-4 not-italic">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <span className="text-sm leading-relaxed text-brand-900">
                <strong className="font-bold">{site.address.line1}</strong>
                <br />
                {site.address.line2}
                <br />
                {site.address.city}, {site.address.state} · {dict.footer.hours}
              </span>
            </address>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.checkout.paymentSection}</h2>
          <div className="mt-5 space-y-3">
            {(
              [
                {
                  value: "on-delivery",
                  title: dict.checkout.payOnDelivery,
                  body: dict.checkout.payOnDeliveryBody,
                },
                {
                  value: "transfer",
                  title: dict.checkout.payTransfer,
                  body: dict.checkout.payTransferBody,
                },
                {
                  value: "card",
                  title: dict.checkout.payCard,
                  body: dict.checkout.payCardBody,
                },
              ] as Array<{ value: PaymentMethod; title: string; body: string }>
            ).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  payment === option.value
                    ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                    : "border-ink-200 hover:bg-ink-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === option.value}
                  onChange={() => setPayment(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-bold text-ink-900">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{option.body}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="field-label">
              {dict.checkout.notes}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="field resize-y"
            />
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink-900">{dict.checkout.summary}</h2>

          <ul className="mt-5 space-y-3 border-b border-ink-100 pb-5">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-3">
                <div className="relative shrink-0 overflow-hidden rounded-lg">
                  <ProductImage
                    categorySlug={product.categorySlug}
                    name={product.name}
                    size="thumb"
                    className="h-14 w-14"
                  />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[11px] font-bold text-white">
                    {quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{product.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {formatPrice(product.price, locale)}
                  </p>
                </div>
                <span className="text-sm font-bold text-ink-900">
                  {formatPrice(product.price * quantity, locale)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">{dict.cart.subtotal}</dt>
              <dd className="font-bold text-ink-900">{formatPrice(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">
                {fulfilment === "pickup" ? dict.checkout.pickup : dict.cart.delivery}
              </dt>
              <dd className="font-bold text-ink-900">
                {delivery === 0 ? dict.cart.deliveryFree : formatPrice(delivery, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-ink-100 pt-5">
            <span className="font-bold text-ink-900">{dict.cart.total}</span>
            <span className="text-2xl font-extrabold text-ink-900">
              {formatPrice(total, locale)}
            </span>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-xl bg-brand-600 py-3.5 font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? `${dict.checkout.placeOrder}…` : dict.checkout.placeOrder}
          </button>

          {submitError && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-flash-500/10 px-4 py-3 text-sm font-semibold text-flash-600"
            >
              {submitError}
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-flash-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="field"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-flash-500">
          {error}
        </p>
      )}
    </div>
  );
}

function OptionCard({
  name,
  checked,
  onChange,
  icon,
  title,
  body,
  meta,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
        checked ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500" : "border-ink-200 hover:bg-ink-50"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-brand-600"
        />
        <span className="text-brand-700">{icon}</span>
        <span className="text-sm font-bold text-ink-900">{title}</span>
        <span className="ml-auto text-sm font-bold text-brand-700">{meta}</span>
      </span>
      <span className="mt-2 pl-[1.625rem] text-xs leading-relaxed text-ink-500">{body}</span>
    </label>
  );
}
