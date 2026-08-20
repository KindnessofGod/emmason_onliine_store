"use client";

import { useState, useTransition, type FormEvent } from "react";
import { submitWholesaleLead } from "@/actions/wholesale";
import { CheckCircleIcon, WhatsAppIcon } from "./icons";
import { interpolate, type Dictionary, type Locale } from "@/lib/i18n";
import { isValidNigerianPhone } from "@/lib/nigeria";
import { whatsappChannelUrl, whatsappLink } from "@/lib/site";

type FieldName = "name" | "whatsapp";

/**
 * The wholesale lead form — just a name and a WhatsApp number, in exchange
 * for 5% off a first bulk order. Shared between the homepage popup and the
 * /sell page so the two don't drift; `source` tags which one a lead came
 * from and keeps input ids unique if both render on the page at once.
 */
export function WholesaleForm({
  locale,
  dict,
  source,
  onSuccess,
}: {
  locale: Locale;
  dict: Dictionary;
  source: "popup" | "page";
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearError(field: FieldName) {
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: Partial<Record<FieldName, string>> = {};
    if (!name.trim()) next.name = dict.checkout.required;
    if (!whatsapp.trim()) next.whatsapp = dict.checkout.required;
    else if (!isValidNigerianPhone(whatsapp)) next.whatsapp = dict.checkout.invalidPhone;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitError(null);
    startTransition(async () => {
      const result = await submitWholesaleLead({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        locale,
        source,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      setSubmittedName(name.trim());
      onSuccess?.();
    });
  }

  if (submittedName) {
    const channelUrl = whatsappChannelUrl();
    return (
      <div className="rounded-card border border-brand-200 bg-brand-50 p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <CheckCircleIcon className="h-8 w-8 text-brand-700" />
        </span>
        <h3 className="mt-4 text-xl font-extrabold text-ink-900">{dict.wholesale.successTitle}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
          {interpolate(dict.wholesale.successBody, { name: submittedName })}
        </p>
        <div className="mt-5">
          {channelUrl ? (
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {dict.wholesale.joinChannel}
            </a>
          ) : (
            <a
              href={whatsappLink(
                `Hi, I just signed up for the wholesale discount. My name is ${submittedName}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {dict.wholesale.chatWhatsapp}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`wholesale-name-${source}`} className="field-label">
          {dict.wholesale.nameLabel}
        </label>
        <input
          id={`wholesale-name-${source}`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `wholesale-name-error-${source}` : undefined}
          autoComplete="name"
          className="field"
        />
        {errors.name && (
          <p id={`wholesale-name-error-${source}`} className="mt-1.5 text-xs font-medium text-flash-500">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`wholesale-whatsapp-${source}`} className="field-label">
          {dict.wholesale.whatsappLabel}
        </label>
        <input
          id={`wholesale-whatsapp-${source}`}
          type="tel"
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => {
            setWhatsapp(e.target.value);
            clearError("whatsapp");
          }}
          aria-invalid={Boolean(errors.whatsapp)}
          aria-describedby={errors.whatsapp ? `wholesale-whatsapp-error-${source}` : undefined}
          placeholder={dict.wholesale.whatsappPlaceholder}
          autoComplete="tel"
          className="field"
        />
        {errors.whatsapp && (
          <p id={`wholesale-whatsapp-error-${source}`} className="mt-1.5 text-xs font-medium text-flash-500">
            {errors.whatsapp}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-600 py-3.5 font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? dict.wholesale.submitting : dict.wholesale.submit}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-400">{dict.wholesale.consent}</p>

      {submitError && (
        <p role="alert" className="rounded-xl bg-flash-500/10 px-4 py-3 text-sm font-semibold text-flash-600">
          {submitError}
        </p>
      )}
    </form>
  );
}
