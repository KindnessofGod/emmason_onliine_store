"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircleIcon, LockIcon } from "./icons";
import { href, interpolate, type Dictionary, type Locale } from "@/lib/i18n";
import { isValidEmail, isValidNigerianPhone, isValidNin, maskNin } from "@/lib/nigeria";
import type { Category } from "@/lib/types";

type FieldName =
  | "businessName"
  | "contactName"
  | "phone"
  | "email"
  | "address"
  | "city"
  | "state"
  | "nin"
  | "categories"
  | "terms";

export function SellerRegistrationForm({
  locale,
  dict,
  categories,
  states,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  states: string[];
}) {
  const [values, setValues] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    nin: "",
    about: "",
  });
  const [picked, setPicked] = useState<string[]>([]);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitted, setSubmitted] = useState<{
    name: string;
    phone: string;
    nin: string;
    reference: string;
  } | null>(null);

  // Same reason as checkout: the form is taller than the viewport.
  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitted]);

  function set(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as FieldName];
      return next;
    });
  }

  function toggleCategory(slug: string) {
    setPicked((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
    setErrors((current) => {
      if (!current.categories) return current;
      const next = { ...current };
      delete next.categories;
      return next;
    });
  }

  function validate(): boolean {
    const next: Partial<Record<FieldName, string>> = {};

    if (!values.businessName.trim()) next.businessName = dict.checkout.required;
    if (!values.contactName.trim()) next.contactName = dict.checkout.required;

    if (!values.phone.trim()) next.phone = dict.checkout.required;
    else if (!isValidNigerianPhone(values.phone)) next.phone = dict.checkout.invalidPhone;

    if (!values.email.trim()) next.email = dict.checkout.required;
    else if (!isValidEmail(values.email)) next.email = dict.checkout.invalidEmail;

    if (!values.address.trim()) next.address = dict.checkout.required;
    if (!values.city.trim()) next.city = dict.checkout.required;
    if (!values.state) next.state = dict.checkout.required;

    if (!values.nin.trim()) next.nin = dict.checkout.required;
    else if (!isValidNin(values.nin)) next.nin = dict.seller.invalidNin;

    if (picked.length === 0) next.categories = dict.seller.pickCategory;
    if (!terms) next.terms = dict.seller.acceptTerms;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) {
      const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstError?.focus();
      firstError?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    // No applications backend yet. The NIN is masked the moment it leaves the
    // form so the raw value never reaches the confirmation screen or a log.
    setSubmitted({
      name: values.businessName.trim(),
      phone: values.phone.trim(),
      nin: maskNin(values.nin),
      reference: `SLR-${values.businessName.trim().slice(0, 3).toUpperCase()}${
        (Date.now() % 10000).toString().padStart(4, "0")
      }`,
    });
  }

  if (submitted) {
    return (
      <div className="rounded-card border border-brand-200 bg-brand-50 p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white">
          <CheckCircleIcon className="h-9 w-9 text-brand-700" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold text-ink-900">
          {dict.seller.submittedTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-600">
          {interpolate(dict.seller.submittedBody, {
            name: submitted.name,
            phone: submitted.phone,
          })}
        </p>

        <dl className="mx-auto mt-6 grid max-w-xs gap-2 text-sm">
          <div className="flex justify-between rounded-lg bg-white px-4 py-2.5">
            <dt className="text-ink-500">{dict.seller.referenceNumber}</dt>
            <dd className="font-extrabold tracking-wide text-ink-900">{submitted.reference}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-white px-4 py-2.5">
            <dt className="text-ink-500">{dict.seller.nin.split(" ")[0]}</dt>
            <dd className="font-mono font-bold text-ink-900">{submitted.nin}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-white px-4 py-2.5">
            <dt className="text-ink-500">{dict.seller.pendingSeller}</dt>
            <dd className="font-bold text-amber-600">48h</dd>
          </div>
        </dl>

        <Link
          href={href(locale, "/sell")}
          className="mt-8 inline-block rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white transition hover:bg-brand-700"
        >
          {dict.common.back}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-extrabold text-ink-900">{dict.seller.businessSection}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              id="businessName"
              label={dict.seller.businessName}
              value={values.businessName}
              error={errors.businessName}
              onChange={(v) => set("businessName", v)}
              autoComplete="organization"
              required
            />
          </div>
          <Field
            id="contactName"
            label={dict.seller.contactName}
            value={values.contactName}
            error={errors.contactName}
            onChange={(v) => set("contactName", v)}
            autoComplete="name"
            required
          />
          <Field
            id="sellerPhone"
            label={dict.seller.businessPhone}
            value={values.phone}
            error={errors.phone}
            onChange={(v) => set("phone", v)}
            type="tel"
            autoComplete="tel"
            placeholder="0906 5755 314"
            required
          />
          <div className="sm:col-span-2">
            <Field
              id="sellerEmail"
              label={dict.seller.businessEmail}
              value={values.email}
              error={errors.email}
              onChange={(v) => set("email", v)}
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              id="sellerAddress"
              label={dict.seller.businessAddress}
              value={values.address}
              error={errors.address}
              onChange={(v) => set("address", v)}
              autoComplete="street-address"
              required
            />
          </div>
          <Field
            id="sellerCity"
            label={dict.seller.businessCity}
            value={values.city}
            error={errors.city}
            onChange={(v) => set("city", v)}
            autoComplete="address-level2"
            required
          />
          <div>
            <label htmlFor="sellerState" className="field-label">
              {dict.seller.businessState} <span className="text-flash-500">*</span>
            </label>
            <select
              id="sellerState"
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? "sellerState-error" : undefined}
              className="field"
            >
              <option value="">{dict.checkout.selectState}</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && (
              <p id="sellerState-error" className="mt-1.5 text-xs font-medium text-flash-500">
                {errors.state}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Identity */}
      <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
          <LockIcon className="h-5 w-5 text-brand-600" />
          {dict.seller.nin}
        </h2>
        <div className="mt-5">
          <label htmlFor="nin" className="field-label">
            {dict.seller.nin} <span className="text-flash-500">*</span>
          </label>
          <input
            id="nin"
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={values.nin}
            onChange={(e) => set("nin", e.target.value.replace(/\D/g, ""))}
            aria-invalid={Boolean(errors.nin)}
            aria-describedby={errors.nin ? "nin-error nin-help" : "nin-help"}
            placeholder="12345678901"
            className="field font-mono tracking-widest"
          />
          <p id="nin-help" className="mt-2 flex gap-2 text-xs leading-relaxed text-ink-500">
            <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {dict.seller.ninHelp}
          </p>
          {errors.nin && (
            <p id="nin-error" className="mt-1.5 text-xs font-medium text-flash-500">
              {errors.nin}
            </p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
        <fieldset>
          <legend className="text-lg font-extrabold text-ink-900">
            {dict.seller.categoriesLabel} <span className="text-flash-500">*</span>
          </legend>
          <p className="mt-1 text-sm text-ink-500">{dict.seller.categoriesHelp}</p>
          <div
            className="mt-5 grid gap-2 sm:grid-cols-2"
            aria-invalid={Boolean(errors.categories)}
            aria-describedby={errors.categories ? "categories-error" : undefined}
          >
            {categories.map((category) => {
              const checked = picked.includes(category.slug);
              return (
                <label
                  key={category.slug}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm transition ${
                    checked
                      ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                      : "border-ink-200 hover:bg-ink-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category.slug)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span aria-hidden="true">{category.glyph}</span>
                  <span className={checked ? "font-semibold text-ink-900" : "text-ink-700"}>
                    {category.name[locale]}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.categories && (
            <p id="categories-error" className="mt-2 text-xs font-medium text-flash-500">
              {errors.categories}
            </p>
          )}
        </fieldset>

        <div className="mt-6">
          <label htmlFor="about" className="field-label">
            {dict.seller.aboutBusiness}
          </label>
          <textarea
            id="about"
            rows={4}
            value={values.about}
            onChange={(e) => set("about", e.target.value)}
            placeholder={dict.seller.aboutBusinessPlaceholder}
            className="field resize-y"
          />
        </div>
      </section>

      {/* Terms + submit */}
      <section className="rounded-card border border-ink-100 bg-white p-6 shadow-soft">
        <label className="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              setErrors((current) => {
                if (!current.terms) return current;
                const next = { ...current };
                delete next.terms;
                return next;
              });
            }}
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          />
          <span className="text-sm leading-relaxed text-ink-700">{dict.seller.terms}</span>
        </label>
        {errors.terms && (
          <p id="terms-error" className="mt-2 text-xs font-medium text-flash-500">
            {errors.terms}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-brand-600 py-3.5 font-bold text-white transition hover:bg-brand-700"
        >
          {dict.seller.submit}
        </button>
        <p className="mt-3 text-center text-xs text-ink-400">{dict.seller.step2Body}</p>
      </section>
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
