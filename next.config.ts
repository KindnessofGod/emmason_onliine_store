import type { NextConfig } from "next";

/**
 * Hosts the browser is allowed to talk to. Derived from the configured Supabase
 * project so a change of project cannot silently leave the CSP pointing at the
 * old one.
 */
const supabaseOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
})();

const PAYSTACK = "https://api.paystack.co https://checkout.paystack.com https://js.paystack.co";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` is present for scripts deliberately. Nearly every page here
 * is statically prerendered, and a nonce cannot be minted for a static page —
 * adopting nonces would force every product page to render per request, which
 * costs real money and latency for a shop this size. What the policy still
 * buys, and what matters most against the realistic threat, is that no script
 * from an origin we did not list can execute, the page cannot be framed, and
 * forms cannot post anywhere but back to us.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${PAYSTACK}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""} ${PAYSTACK}`,
  `frame-src ${PAYSTACK}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // Only our own Supabase storage. A wildcard here turns Next's image
    // optimiser into an open proxy that anyone can point at any URL, on our
    // bandwidth bill.
    remotePatterns: supabaseOrigin
      ? [{ protocol: "https", hostname: new URL(supabaseOrigin).hostname }]
      : [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Two years, preloadable. The site is HTTPS-only in production.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // The admin area must never be cached by a shared proxy — it renders
        // order and customer data behind a session cookie.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
