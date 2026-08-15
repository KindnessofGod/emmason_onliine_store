import type { ReactNode } from "react";
import { Breadcrumbs } from "./ui";
import { href, type Dictionary, type Locale } from "@/lib/i18n";

/** Shared shell for the policy and help pages linked from the footer. */
export function InfoPage({
  locale,
  dict,
  title,
  body,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs
          items={[{ label: dict.nav.home, href: href(locale) }, { label: title }]}
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {title}
        </h1>
        {body && <p className="mt-6 text-lg leading-relaxed text-ink-600">{body}</p>}
        {children}
      </div>
    </div>
  );
}
