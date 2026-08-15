"use client";

import { useState, type FormEvent } from "react";
import { CheckCircleIcon } from "./icons";
import { isValidEmail } from "@/lib/nigeria";

export function NewsletterForm({
  placeholder,
  cta,
  thanks,
  invalid,
}: {
  placeholder: string;
  cta: string;
  thanks: string;
  invalid: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      return;
    }
    // No mailing-list backend yet — this confirms locally so the flow is testable.
    setStatus("done");
    setEmail("");
  }

  if (status === "done") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-brand-500/15 px-4 py-3 text-sm font-semibold text-brand-200">
        <CheckCircleIcon className="h-5 w-5 shrink-0" />
        {thanks}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            {placeholder}
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder={placeholder}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? "newsletter-error" : undefined}
            className="field !border-white/20 !bg-white/10 !text-white placeholder:!text-ink-400"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-[0.625rem] bg-brand-500 px-5 text-sm font-bold text-white transition hover:bg-brand-400"
        >
          {cta}
        </button>
      </div>
      {status === "error" && (
        <p id="newsletter-error" className="mt-2 text-xs font-medium text-flash-500">
          {invalid}
        </p>
      )}
    </form>
  );
}
