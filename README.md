# Emmason — multilingual electronics marketplace

Live: <https://emmason-store.vercel.app>

Storefront and seller marketplace for **Emmason Mobile Phones, Tech & Gadgets**
(No 24 Day Star Plaza, Owerri, Imo State). Customers buy directly in one of five
languages; verified third-party sellers list alongside the house catalogue.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase ·
Paystack

New to this codebase? Read [`HANDOFF.md`](./HANDOFF.md) first — it covers the
decisions already made and the questions still open.

## Getting started

Node 20+ and Docker.

```bash
npm install
npx supabase start          # Postgres, PostgREST and Auth in Docker
cp .env.example .env.local  # fill in from what `supabase start` prints
npm run dev                 # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`.
`node scripts/verify.mjs` drives the running app end to end in a real browser.

## Languages

Five locales, each fully translated rather than machine-stubbed:

| Code | Language |
| ---- | -------- |
| `en` | English |
| `yo` | Yorùbá |
| `ig` | Igbo |
| `ha` | Hausa |
| `fr` | Français |

Every route is locale-prefixed (`/yo/shop`, `/ha/product/nokia-105-dual-sim`).
`/` redirects via `src/proxy.ts`, which prefers the `emmason_locale` cookie set
by the switcher and otherwise negotiates from `Accept-Language`. Switching
language keeps you on the same page.

English is the source of truth: `src/lib/i18n/dictionaries/en.ts` defines the
`Dictionary` type and the other four are typed against it, so a missing key
fails `npm run typecheck` rather than rendering blank.

> The Yorùbá, Igbo and Hausa copy was written without a native speaker in the
> loop. Have one review it before launch.

## What works

**Shopping** — 16 categories, 102 products, search, filters and sort held in the
URL so a filtered listing is shareable. Product pages carry specs, warranty,
condition (new / UK-used / refurbished), seller attribution and Product JSON-LD.

**Built for phones** — a bottom-docked buy bar that yields while the real
button is on screen, a WhatsApp enquiry route on every product, and 44px
minimum touch targets. `node scripts/mobile-audit.mjs` checks 360/390/414px for
sideways scroll, small targets and unreadable text.

**Cart and checkout** — the cart persists in `localStorage` and holds product
ids only, never prices. Checkout offers **store pickup** (free) or **nationwide
delivery** priced per state, with free delivery over a configurable threshold.
Pay by card through Paystack, or by transfer / on delivery with the order handed
to WhatsApp pre-filled.

**Marketplace** — sellers apply, Emmason approves from `/admin/applications`,
and approval creates the seller record. NIN is validated as 11 digits and stored
**masked only** (`••••••••901`); the full number is never persisted.

**Admin** — `/admin`, gated by Supabase auth plus an `admins` roster row.
Revenue and low-stock overview, orders with status transitions, product CRUD
with inline stock editing, and the application queue.

## How the money works

Every amount is stored as an **integer number of kobo** (₦1 = 100 kobo) and
converted to whole Naira only for display, in one place. No arithmetic touches
a float, so totals cannot drift. Paystack also denominates NGN in kobo, so
amounts pass to it unconverted.

## Data

Postgres, via Supabase. `supabase/migrations/` holds the schema, RLS policies,
explicit grants and the order functions; `supabase/seed.sql` and
`supabase/seed_i18n.sql` hold the catalogue — 16 categories, 102 products,
5 sellers, 37 delivery zones.

Product names and naira prices were researched against the Nigerian market in
August 2026 so the store opens with believable numbers. **They are still
placeholders** — confirm every price against real cost before selling, and
re-check periodically, since naira pricing on imported electronics moves with
the exchange rate. Delivery fees are priced outward from Owerri, not Lagos.

The whole storefront reads through one module, `src/lib/data/index.ts`.

## Product photography

All 102 products carry a real photograph — no product page shows the
gradient/icon fallback. `scripts/source-images.mjs` is the pipeline: it searches
Openverse (Creative Commons, filtered to licences that permit reuse), lets a
reviewer look at candidates before committing, re-encodes with `sharp` and
uploads to the `product-images` Storage bucket, and writes `images` plus a
licence trail in `image_credits` on the product row.

**This is placeholder photography for a demo, not the finished catalogue.**
Emmason will supply real product photos; when that happens, `apply` on the
real slug overwrites the placeholder in one step, same as it was set. Every
sourced photo keeps a `title`/`creator`/`license`/`source` credit in
`image_credits`, so it's traceable and swappable later, and so a `CC BY`
image's attribution is on record even though the storefront doesn't render
it yet.

The first pass covered 75; a second pass, run after the shop owner said
plainly that they don't want any icon or emoji standing in anywhere, closed
the remaining 27 — including six that show a legible rival brand where
Openverse had no inventory for oraimo, itel, Tecno, Ox or Hikity (a Nokia
photo standing in for a Tecno button phone, an Anker power bank for an oraimo
one). That's a disclosed trade-off, not an oversight — see `HANDOFF.md` for
the exact six and the reasoning behind each.

## Homepage design

The hero and category grid are built on that photography rather than icons.
Research on ecommerce/electronics hero design (Konga, oraimo, and general
conversion data — see `HANDOFF.md`) points the same direction consistently:
real product photos with a visible price and discount outperform abstract
brand imagery, and the electronics shopper wants to see the thing, not a
mood. Two concrete changes follow from that:

- **The hero is a deal bento**, not a plain gradient: the single deepest
  discount gets a tall featured tile, two more sit beside it, each carrying
  its real price and — only where genuine — its real saving. It renders on
  mobile now too; the old collage was `hidden lg:block`, so phones (most of
  this traffic) never saw a product photo in the hero at all.
- **Category tiles show a real photo**, hand-picked per category from that
  category's own products rather than the emoji-on-gradient tile. The
  gradient/glyph is the fallback for a category that hasn't had one chosen
  yet (`categories.showcase_image_url`, migration `0008`), not the default
  look.

## Environment

See `.env.example`. The ones that matter in production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Builds the Paystack callback URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits only, e.g. `2349065755314` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS |
| `PAYSTACK_SECRET_KEY` | Server only. Also verifies webhook signatures |

`NEXT_PUBLIC_SUPABASE_URL` must be set at **build** time as well as runtime: it
seeds the Content-Security-Policy allow-list and the image optimiser's host
list in `next.config.ts`.
