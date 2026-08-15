import Link from "next/link";
import { getDictionary, href, defaultLocale } from "@/lib/i18n";

/**
 * Rendered for unknown routes under a locale. `notFound()` does not expose the
 * route params, so this falls back to the default locale's copy.
 */
export default function NotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-ink-900 sm:text-3xl">
        {dict.common.notFoundTitle}
      </h1>
      <p className="mt-3 max-w-md text-ink-500">{dict.common.notFoundBody}</p>
      <Link
        href={href(defaultLocale)}
        className="mt-8 rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white transition hover:bg-brand-700"
      >
        {dict.common.goHome}
      </Link>
    </div>
  );
}
