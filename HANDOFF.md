# Handoff — Emmason multilingual electronics marketplace

**Last updated:** 2026-08-15
**Repo:** `KindnessofGod/emmason_onliine_store`
**Working branch:** `claude/online-store-capabilities-1akdt9`
**Status:** pushed, working tree clean, build green, typecheck and lint clean

This supersedes the earlier handoff written on
`claude/multilingual-electronics-marketplace-kj0jl0`. That branch's work is
**merged in**, not abandoned — both histories are in this branch.

Read sections 1–3 before touching code. Section 7 is the backlog.

---

## 1. What this is

An online store **and** multi-seller marketplace for **Emmason Mobile Phones,
Tech & Gadgets** — a real shop at No 24 Day Star Plaza, opposite St. Peter's
Anglican Church, Owerri, Imo State. Phones 0906 5755 314 and 0803 863 0197;
TikTok `@emmasongadgets`.

Two things make it more than a plain storefront:

1. **It speaks five languages** — English, Yorùbá, Igbo, Hausa, French.
2. **It is a marketplace.** Third-party sellers apply, get approved, and list
   alongside Emmason's own stock.

Customers pay by card (Paystack), bank transfer, or on delivery, and can
either collect from the shop or have it delivered nationwide.

## 2. Requirements that are settled — do not relitigate

These came from the user directly and are binding:

| Question | Answer |
| --- | --- |
| Languages | English + Yorùbá + Igbo + **Hausa** + **French** (5) |
| Single store or marketplace? | **Marketplace with seller onboarding** |
| Fulfilment | **Store pickup + nationwide delivery** |
| Payments | **Paystack**, plus a WhatsApp ordering option |
| Market / currency | **Nigeria only, ₦ (NGN)** |
| Categories | The user's own handwritten list of **16** (see `supabase/seed.sql`) |
| Product data | Sample data for now; real photos to come |

### Still open — needs the user

1. **NIN.** Seller registration captures it. The user mentioned NIN in their
   original voice brief but did *not* tick it when asked. It was built anyway
   and flagged; **they have still not answered.** It is now stored **masked
   only** (`••••••••901`) — the full 11 digits are validated in the form and
   never persisted, which lowers the stakes considerably. If they want it gone:
   `src/lib/nigeria.ts` (`isValidNin`, `maskNin`), the NIN block in
   `src/components/seller-registration-form.tsx`, the `nin`/`ninHelp`/
   `invalidNin` dictionary keys, and the `nin_masked` column.
2. **Product photography.** Still the single biggest visible gap.
3. **Seller dashboard scope** — is it "sellers log in and manage their own
   listings", or "they apply, Emmason lists it for them"? Changes the next
   phase enormously.
4. **Nigerian Pidgin** as a sixth locale — offered once, never answered.
5. **Translation review.** The Yorùbá, Igbo and Hausa strings were written
   without a native speaker. They are good-faith, not verified. Get a speaker
   to read them before launch.

## 3. Architecture — the parts that matter

```
src/
  app/
    (shop)/[locale]/   customer pages. THE SHOP'S ROOT LAYOUT LIVES HERE
    (admin)/           staff area, its own root layout, English only
    api/paystack/      webhook receiver
  actions/             server actions: checkout, seller application, admin
  components/          UI; admin components under components/admin
  lib/
    data/index.ts      >>> the only read path for the catalogue <<<
    i18n/              en.ts is the source of truth; yo/ig/ha/fr typed against it
    db-types.ts        raw table shapes (kobo, jsonb)
    types.ts           domain shapes the UI renders (whole Naira, localised)
    orders.ts          order reads/writes
    paystack.ts        initialise, verify, webhook signature
    category-style.ts  glyph + gradient per category (presentation, not data)
  proxy.ts             locale negotiation AND admin session refresh
supabase/
  migrations/          schema, RLS, grants, order functions
  seed.sql             16 categories, 64 products, 37 delivery zones
  seed_i18n.sql        five-language copy, sellers, marketplace back-fill
scripts/verify.mjs     end-to-end browser check (see section 6)
```

**There is deliberately no `src/app/layout.tsx`.** The shop's root layout is
`(shop)/[locale]/layout.tsx` so `<html lang>` follows the locale; admin has its
own at `(admin)/layout.tsx`. This is Next's multiple-root-layouts pattern.
Adding `src/app/layout.tsx` would nest two `<html>` tags and break routing.

**`src/middleware.ts` does not exist either.** Next 16 calls it `proxy.ts`, and
both locale negotiation and the admin auth gate live in that one file.

### Money

Stored as **integer kobo** everywhere in the database — that is what Paystack
expects and it means totals cannot drift. The UI works in **whole Naira**.
`toNaira()` in `src/lib/data/index.ts` is the only conversion point.

### The catalogue read path

Every page reads through `src/lib/data/index.ts`. Filtering, sorting and search
run in Postgres, not JavaScript. It uses a **cookieless** Supabase client
(`createSupabaseCatalogClient`) because `generateStaticParams` runs at build
time with no request in scope — a cookie-bound client throws there.

### How an order is placed

The browser's cart holds **product ids and quantities only, never prices**.
`place_order()` (migration 0006) then, in one transaction:

1. validates the destination if it is a delivery,
2. locks each product with `SELECT … FOR UPDATE`,
3. reads the real price and checks stock,
4. writes the order and line items with prices snapshotted,
5. decrements stock,
6. **then** resolves the delivery fee — because whether delivery is free
   depends on the subtotal it just computed.

So a tampered cart cannot change what a customer is charged, and two shoppers
racing for the last unit cannot both win it. `cancel_order()` returns reserved
stock and is guarded against repeat cancellation inflating inventory.

### Payment confirmation

An order is marked paid only on evidence from Paystack, never on a redirect:
the webhook verifies the `x-paystack-signature` HMAC in constant time, then
independently calls Paystack's verify endpoint, and refuses underpayments. The
return page verifies too, as a fallback. Marking paid is idempotent, so both
paths can race safely.

Point the Paystack dashboard webhook at `https://your-domain/api/paystack/webhook`.

### Security posture

RLS denies by default. The anon key reads the live catalogue and nothing else —
it cannot read a single order or application. Every write goes through
server-side code holding the service role key. `0004_grants.sql` states table
privileges explicitly rather than relying on Supabase's implicit defaults, so
the schema behaves identically hosted, local and in CI.

## 4. Running it

Node 20+ and Docker.

```bash
npm install
npx supabase start          # Postgres + PostgREST + Auth in Docker
cp .env.example .env.local  # fill in from what `supabase start` prints
npm run dev
```

In a restricted environment some optional containers fail; only the core are
needed:

```bash
npx supabase start -x edge-runtime,studio,imgproxy,inbucket,realtime,storage-api,supavisor,vector
```

### First admin

Admin access is a row in `public.admins`. Nothing in the UI grants it.

```bash
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"…","email_confirm":true}'
```

then `insert into public.admins (user_id, email) values ('<id>', 'you@example.com');`
and sign in at `/admin/login`.

## 5. What is built

**Shop** (all under `/[locale]/`, 5 locales): home, shop with URL-held filters
and sort, category, product (specs, warranty, seller attribution, JSON-LD),
cart, checkout, deals, sell landing, seller registration, public seller pages,
about, contact, and the policy pages.

**Checkout** collects contact details, pickup-vs-delivery, and payment method.
Card goes to Paystack; transfer and pay-on-delivery record the order and open a
WhatsApp thread pre-filled with everything Emmason needs.

**Admin** (`/admin`): overview with revenue and low stock, order list and detail
with status transitions, product CRUD with inline stock editing, and a seller
application queue where approving an application **creates the seller**.

## 6. Verified by driving a real browser

`node scripts/verify.mjs` (dev server running) exercises: all five locales and
their `<html lang>`, the catalogue coming from Postgres, language switching
preserving the page, a real order through checkout, seller registration, and
admin sign-in through to the application queue. It reports any console or page
error. Last run: **zero errors**, order `EMM-BBBCB1`, application `SEL-32FAE2`.

Chromium is pre-installed. Launch with
`executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"`.
Do **not** run `playwright install`.

### Bugs found this way, not by inspection

- `place_order()` called `gen_random_bytes()` from pgcrypto, which Supabase
  installs into the `extensions` schema — invisible to the function's pinned
  `search_path`. Every checkout failed. Now built on core `gen_random_uuid()`.
- RLS policies were unreachable because the tables had no `GRANT`s. Hosted
  Supabase's broad defaults masked it; a fresh database 500'd on every page.
- The seed's seller distribution used `LIKE '%-00[23]'`. `[23]` is not a LIKE
  wildcard, so all 64 products landed on the house account and every
  third-party seller showed zero listings.

## 7. Backlog

### Blocking launch

1. **Real photography.** `ProductImage` draws a branded gradient tile per
   category so nothing looks broken, but this is a content problem — ask the
   user for images.
2. **A hosted Supabase project.** Blocked: the account is at its free-tier
   limit of 2 active projects. The user must pause one or upgrade.
3. **Paystack keys.** The integration is complete but has never run against
   the live API. WhatsApp ordering works without them.
4. **Deploy.** Vercel MCP tools are available; blocked on item 2.

### Significant

5. **Seller dashboard.** Approved sellers still cannot log in, add a product or
   see their orders. Largest missing slice of the marketplace promise, and it
   needs customer/seller authentication first.
6. **Order notifications.** Orders persist and appear in admin, but nothing
   emails or messages Emmason when one lands.
7. **Product descriptions are English-only.** `description_i18n` holds `{en}`
   and the data layer falls back to English for other locales. Category names,
   taglines and all UI chrome *are* fully translated.
8. **Real reviews.** Ratings and counts are seeded numbers; there is no way to
   leave one.
9. **Order tracking for customers.** The reference is shown but there is no
   public lookup page any more (the single-store branch had one; it did not
   survive the merge into the locale-prefixed routing).

### Polish

10. Search is `ilike` across name, brand and description — fine at 64 products,
    wants a real index later.
11. `scripts/verify.mjs` is a script, not a test suite. Worth promoting to
    Playwright proper with assertions rather than console output.
12. The product gallery shows the same generated tile four times; becomes real
    with photography.
13. `lucide-react` is a dependency used **only** by the admin panel — the shop
    hand-builds its icons in `src/components/icons.tsx`.

## 8. Environment gotchas

- **Never `pkill -f "next dev"`** — the pattern matches the bash command's own
  command line and kills the shell mid-command. Use `kill $(lsof -ti:3000)`.
- **Restart the server after `next build`.** Rebuilding under a running server
  serves stale chunks; the browser shows a load failure while `curl` returns
  200. Looks exactly like an app bug and is not one.
- The Supabase CLI's `pg-delta` step fails behind the agent proxy (TLS). It is
  a warning, not fatal — migrations and seeds still apply.
- Google Fonts resolves through the proxy; `Plus_Jakarta_Sans` works at build.
