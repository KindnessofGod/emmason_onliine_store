import { createServerClient } from "@supabase/ssr";
import { geolocation } from "@vercel/functions";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "./lib/i18n/config";

const LOCALE_COOKIE = "emmason_locale";

/**
 * ISO 3166-1 country codes for the Francophone countries most likely to
 * actually reach this store — France plus West/Central African neighbours.
 * Deliberately excludes officially-bilingual countries (Canada, Belgium,
 * Switzerland) where an English default is at least as likely to be right.
 */
const FRENCH_COUNTRIES = new Set([
  "FR", "BJ", "BF", "CM", "CF", "TD", "CG", "CD", "CI", "DJ", "GA", "GN", "ML", "NE", "SN", "TG",
]);

/**
 * Nigerian states (bare ISO 3166-2 region code, as Vercel's geolocation
 * reports it — e.g. "KN", not "NG-KN") with a clear Hausa-, Yorùbá- or
 * Igbo-speaking majority. Deliberately conservative: ethnically-mixed
 * states (Borno, Adamawa, the Middle Belt) are left unmapped so they fall
 * through to the Accept-Language negotiation below rather than guess wrong.
 */
const NIGERIAN_REGION_LOCALE: Record<string, string> = {
  // Hausa-majority north.
  KN: "ha", KT: "ha", SO: "ha", ZA: "ha", KE: "ha", JI: "ha", KD: "ha", BA: "ha", GO: "ha", YO: "ha", NI: "ha",
  // Yorùbá-majority southwest.
  LA: "yo", OG: "yo", OY: "yo", OS: "yo", ON: "yo", EK: "yo",
  // Igbo-majority southeast.
  AN: "ig", IM: "ig", EN: "ig", AB: "ig", EB: "ig",
};

/**
 * Best-effort locale from the visitor's IP location. Takes priority over
 * Accept-Language below: most phones in Nigeria ship with an English OS
 * regardless of the owner's spoken language, so negotiating from the
 * browser header alone would serve everyone English by default — geography
 * is the stronger signal here. Returns null with nothing to go on (no geo
 * data at all outside Vercel's edge network, e.g. local dev, or a country/
 * region this store has no mapping for), so callers fall back to
 * Accept-Language, then English.
 */
function geoLocale(request: NextRequest): string | null {
  const { country, countryRegion } = geolocation(request);
  if (!country) return null;

  if (country === "NG" && countryRegion) {
    const match = NIGERIAN_REGION_LOCALE[countryRegion.toUpperCase()];
    if (match) return match;
  }

  if (FRENCH_COUNTRIES.has(country)) return "fr";
  return null;
}

/** Picks the best supported locale from the Accept-Language header. */
function negotiateLocale(header: string | null): string {
  if (!header) return defaultLocale;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        quality: q ? Number.parseFloat(q.split("=")[1]) || 0 : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const match = locales.find((l) => l === tag || l === base);
    if (match) return match;
  }

  return defaultLocale;
}

/**
 * Staff area. Refreshes the Supabase session cookie and turns anonymous
 * visitors away before any admin page renders. Admin is deliberately not
 * locale-prefixed — it is internal tooling, English only.
 */
async function handleAdmin(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without configuration there is no session to refresh; let the page render
  // and surface the missing-env error itself.
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdmin(request);
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  // An explicit choice from the language switcher outranks everything else;
  // failing that, geolocation outranks the browser header (see geoLocale).
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && locales.some((l) => l === cookieLocale)
      ? cookieLocale
      : geoLocale(request) ?? negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals and static files. /admin is included so
  // the session refresh above runs; /api is not, since route handlers do their
  // own authentication.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
