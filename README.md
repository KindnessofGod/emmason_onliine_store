# Emmason — multilingual electronics marketplace

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

**Shopping** — 16 categories, search, filters and sort held in the URL so a
filtered listing is shareable. Product pages carry specs, warranty, condition
(new / UK-used / refurbished), seller attribution and Product JSON-LD.

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
`supabase/seed_i18n.sql` hold the sample catalogue — 16 categories, 64 products,
5 sellers, 37 delivery zones.

The whole storefront reads through one module, `src/lib/data/index.ts`.

Product imagery is still generated: `ProductImage` draws a branded gradient tile
per category rather than a broken `<img>`. Swap it for `next/image` once real
photography exists.

## Environment

See `.env.example`. The ones that matter in production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Builds the Paystack callback URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits only, e.g. `2349065755314` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS |
| `PAYSTACK_SECRET_KEY` | Server only. Also verifies webhook signatures |
