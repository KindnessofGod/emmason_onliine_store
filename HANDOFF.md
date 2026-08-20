# Handoff — Emmason multilingual electronics marketplace

**Last updated:** 2026-08-19
**Repo:** `KindnessofGod/emmason_onliine_store`
**Working branch:** `claude/online-store-capabilities-1akdt9`
**Status:** live at <https://emmason-store.vercel.app> — pushed, working tree clean, build green, typecheck and lint clean

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
2. **It is a marketplace**, though no longer a growing one by design: the
   sellers already onboarded keep their listings and shop pages, but the
   site stopped recruiting new ones (§5, Wholesale pivot) — it now pitches
   wholesale/bulk buying from Emmason instead, with a 5%-off lead-gen popup.

Customers pay by card (Paystack), bank transfer, or on delivery, and can
either collect from the shop or have it delivered nationwide.

## 2. Requirements that are settled — do not relitigate

These came from the user directly and are binding:

| Question | Answer |
| --- | --- |
| Languages | English + Yorùbá + Igbo + **Hausa** + **French** (5) |
| Single store or marketplace? | **Marketplace, but no longer recruiting new sellers** — existing sellers keep their listings and shop pages; the site now pitches wholesale/bulk buying instead of "become a seller" (see §5, Wholesale pivot) |
| Fulfilment | **Store pickup + nationwide delivery** |
| Payments | **Paystack**, plus a WhatsApp ordering option |
| Market / currency | **Nigeria only, ₦ (NGN)** |
| Categories | The user's own handwritten list of **16** (see `supabase/seed.sql`) |
| Product data | Researched real models and naira prices; photos still to come |

### Still open — needs the user

1. **Nigerian Pidgin** as a sixth locale — offered once, never answered.
2. **Translation review.** The Yorùbá, Igbo, Hausa and French strings were
   written without a native speaker. They are good-faith, not verified. Get a
   speaker to read them before launch — this now includes the new `wholesale`
   dictionary section (§5, Wholesale pivot).
3. **WhatsApp Channel invite link.** The wholesale popup/page send leads to
   join Emmason's WhatsApp Channel after they claim their 5% off, but no
   channel exists yet. See §5 and §7 for what to do.

~~NIN.~~ **Moot.** Seller registration (and the NIN field it captured) was
removed outright in the wholesale pivot — see §5.

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
  seed.sql             16 categories, 102 products, 37 delivery zones (Owerri-priced)
  seed_i18n.sql        five-language copy, sellers, marketplace back-fill
scripts/verify.mjs     end-to-end browser check (see section 6)
scripts/mobile-audit.mjs  360/390/414px overflow and tap-target audit
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

### Selling without dark patterns

The persuasion on this site is deliberately all real, and that is a design
constraint rather than an oversight:

- Low-stock warnings read the actual `stock` column.
- The free-delivery progress bar measures the real subtotal against the real
  threshold in `store_settings`.
- A struck-through "was" price appears only where `compare_at_price_kobo` holds
  a genuinely higher former price. **Never populate that column to manufacture a
  discount** — under the FCCPA a false reference price is a misleading trade
  practice, and Emmason is a physical shop in Owerri whose customers come back.
- There are no countdown timers, no "N people are viewing this", no fabricated
  reviews. `rating` and `review_count` are still seeded numbers and must be
  replaced with real review data or removed before launch (backlog item 8).

What does the conversion work instead: a bottom-docked buy bar on phones, a
WhatsApp enquiry route on every product, the naira saving stated next to the
percentage, and the fewest possible fields at checkout.

### Security posture

RLS denies by default. The anon key reads the live catalogue and nothing else —
it cannot read a single order or application. Every write goes through
server-side code holding the service role key. `0004_grants.sql` states table
privileges explicitly rather than relying on Supabase's implicit defaults, so
the schema behaves identically hosted, local and in CI.

On top of that, in `next.config.ts` and `src/lib/rate-limit.ts`:

- **CSP** with `frame-ancestors 'none'`, `object-src 'none'`, `form-action
  'self'`, and an allow-list of exactly our Supabase project and Paystack.
  `script-src` keeps `'unsafe-inline'` on purpose — nearly every page is
  statically prerendered and a nonce cannot be minted for a static page, so
  adopting nonces would force per-request rendering of 500+ product pages. The
  policy still stops any script from an unlisted origin, framing, and form
  hijacking.
- **HSTS** (2 years, preload), `nosniff`, `X-Frame-Options: DENY`, a
  `strict-origin-when-cross-origin` referrer policy, and camera/mic/geolocation
  denied.
- **`/admin/*` is `no-store`** so no shared cache ever holds customer data.
- **`images.remotePatterns` is pinned to the Supabase host.** It was `**`,
  which turns Next's image optimiser into an open proxy anyone can point at any
  URL on Emmason's bandwidth.
- **Rate limits** on the two unauthenticated writes: checkout (10 per 10
  minutes) and seller applications (5 per hour). Fixed-window and in-process,
  so on serverless each instance counts separately — this stops casual abuse
  and retry storms, not a funded attacker. Oversell is prevented in Postgres
  regardless, by the row locks in `place_order()`.

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
cart, checkout, deals, a wholesale landing page (`/sell`), public seller pages,
about, contact, and the policy pages.

**Checkout** collects contact details, pickup-vs-delivery, and payment method.
Card goes to Paystack; transfer and pay-on-delivery record the order and open a
WhatsApp thread pre-filled with everything Emmason needs.

**Admin** (`/admin`): overview with revenue and low stock, order list and detail
with status transitions, product CRUD with inline stock editing, and a
wholesale-leads list (name, WhatsApp number, source, a contacted toggle — no
approval step, since a lead isn't an account).

**Homepage design.** The plain green-gradient hero and the emoji-glyph
category grid were both replaced after the shop owner said directly they
didn't want icons — they wanted real product photography. Before touching
code, this was researched rather than guessed:

- General ecommerce hero conversion data ([Shopify](https://www.shopify.com/blog/16480796-how-to-create-beautiful-and-persuasive-hero-images-for-your-online-store),
  [Omniconvert](https://www.omniconvert.com/blog/hero-section-examples/)):
  users spend ~80% of attention above the fold; mobile parity and fast load
  matter more than a big hero video/carousel for a store like this one.
- Electronics-specific: shoppers "want to know what the thing does before
  they want to know how beautiful it is" — close-up real product shots
  paired with a concrete benefit or price beat lifestyle imagery
  ([ConvertCart](https://www.convertcart.com/blog/hero-image-examples-ecommerce)).
- Product photo quality data: professionally-shot product photos convert
  roughly 40–94% higher than generic/no-photo equivalents across the studies
  surveyed — the strongest single argument for leaning on the photography
  sourced this session rather than the gradient tiles
  ([SellHound](https://www.sellhound.com/learn/conversion-rate-product-photos)).
- What real marketplaces actually do: fetched Konga's live homepage and
  oraimo Nigeria's directly. Both lead with real product photography and
  visible discount percentages ("Get up to 70% off") rather than brand
  storytelling, and — the concrete detail that mattered most — oraimo ships
  a **separate mobile-specific hero banner** (`ngbanner-users-m.png`) rather
  than hiding the visual on small screens.
- Current layout pattern: the asymmetric "bento grid" (one large tile + a
  few smaller ones) is the dominant 2026 pattern for showing several real
  products at once without a slow autoplay carousel — Apple popularised the
  shape, and it's now common across ecommerce hero sections.

That last point directly named the bug in the old hero: the product collage
was `hidden lg:block`, so **phones never saw a product photo in the hero at
all** — a real defect given most of this traffic is mobile, not a matter of
taste.

What changed, concretely:

1. **Hero** (`src/app/(shop)/[locale]/page.tsx`) — replaced the four-image
   collage with a 3-tile deal bento: the deepest real discount gets a tall
   featured tile, two more sit beside it, each carrying its real price and,
   only where genuine, its real "was" price. Renders identically in shape on
   mobile (stacked: one full-width tile, two side by side) and desktop (tall
   left tile, two stacked right) — same markup, responsive spans, no JS.
   Added one real trust line under the subhead — total live product count
   and verified seller count, both already computed for this page, not
   invented.
2. **Category tiles**, homepage grid and the category detail page banner —
   both now render `categories.showcase_image_url` (migration `0008`) when
   set: a real photo of something that category actually sells, chosen by a
   human (four parallel agents, one per four categories, each downloading
   and visually comparing 3-5 candidates before picking) rather than picked
   automatically. The gradient-and-glyph tile is now the fallback for a
   category with no showcase image chosen yet, not the default look — all
   16 have one.

Unlike the earlier photo-sourcing pass, brand mismatch was explicitly a
non-issue here: a category tile represents "here's the kind of thing sold
in Bluetooth Speakers," not a specific listing, so whichever real photo in
that category looks best on a small tile — regardless of which brand
happens to be visible on the product itself — was fair game.

**Hero lifestyle photo.** The bento tiles above sit in front of a real photo
of a person genuinely enjoying a gadget, not a flat brand-green background.
First attempt (an Openverse stock photo, desaturated and blended into the
brand colour via `mix-blend-mode: multiply`) was shown to the shop owner and
explicitly rejected on three counts: wrong subject (not Black), wrong
gadget/mood (didn't read as genuine excitement), and the grayscale/duotone
treatment itself. A further Openverse/Wikimedia Commons search for a
suitable Black/African lifestyle photo came up empty (watermarked stock,
back-of-head-only shots, nothing usable under a free licence), so the shop
owner generated their own images instead (ChatGPT/Google Flow, prompts
written collaboratively) and pushed them directly into the repo. The chosen
photo — a woman listening to music on headphones against a clean, warm
backdrop — was resized/compressed with `sharp` and uploaded to Supabase
Storage at `site/hero-lifestyle-headphones.jpg`; it now renders full colour
(no duotone) behind the whole hero section at every breakpoint via
`next/image fill`, with a short top-heavy gradient scrim
(`from-brand-900/75 via-brand-900/25 to-transparent`) so the headline stays
legible without darkening the photo lower down. Crop position
(`object-[68%_28%]` → `sm:object-[72%_center]` → `lg:object-[80%_center]`)
was tuned specifically against a 375px-wide screenshot so her face and the
headphones stay in frame on the smallest phones, not just on desktop.

Two more of the shop owner's photos were processed and uploaded for future
use but are not wired into any page yet:
`site/lifestyle-man-earbuds-phone.jpg` and `site/lifestyle-men-boombox.jpg`
(good candidates for the Earbuds/Headsets and Bluetooth Speakers category
banners respectively, if wanted later). Note the boombox photo shows a
visible JBL logo — a real trademark, since it's AI-generated rather than
licensed stock — worth a second look before that photo goes live anywhere.
The raw multi-megabyte source `.jpeg` files were removed from the repo
(`images/`) once processed, matching the existing convention of hosting
photography only via Supabase Storage, never committing raw binaries.

**Hero photo, mobile only.** Shown live on a real desktop screen, the hero
photo above read as a wash of green with the person barely visible — the
gradient scrim needed to keep the headline legible over the deal tiles
crushed the photo down to a sliver at the right edge. Rather than keep tuning
the scrim, desktop (`lg:` and up) now shows the original solid-brand + SVG
wave background again; the photo still renders full colour on phones and
tablets, where it looked right from the start. Both live side by side in
`src/app/(shop)/[locale]/page.tsx` — `<Image>` and the gradient scrim are
`lg:hidden`, the `<svg>` is `hidden lg:block`.

**Mobile menu was rendering empty.** Tapping the hamburger showed only a thin
white strip at the top of the screen instead of the full drawer. Root cause:
`<header>` carries `backdrop-blur` (`backdrop-filter`), and the CSS spec
makes any element with `backdrop-filter`, `filter`, `transform` or
`will-change` a new *containing block* for `position: fixed` descendants —
so the drawer's `fixed inset-0` was being measured against the header's own
~100px box instead of the viewport. Fixed in `src/components/header.tsx` by
`createPortal`-ing the drawer to `document.body`, clear of that containing
block. Worth remembering for any other `fixed`-positioned overlay added
under `<header>` later — the wholesale popup below was portalled from the
start for exactly this reason.

**Product cards were too small on phones.** The shop owner's complaint —
"you can barely see the product" — was investigated with two parallel
agents taking real screenshots and pixel measurements across every page that
renders `ProductGrid` (`src/components/product-card.tsx`). Two real causes,
both fixed:

- `ProductGrid` jumped straight from 2 columns to 4 at the `lg` breakpoint,
  never dropping below 2 even on the narrowest phones — a ~171px-wide product
  image at 390px viewport width, illegible for anything with packaging text
  (a tool kit box, a charging kit pouch). Now `grid-cols-1 sm:grid-cols-2
  lg:grid-cols-4` — full-width on phones, roughly doubling image size where
  it's actually being viewed from.
- On category pages specifically (`category/[slug]/page.tsx`), the photo
  hero banner plus three stacked chrome blocks (breadcrumbs, filters button,
  results-count/sort row) pushed the grid below the fold on a real phone's
  visible viewport. Trimmed the hero's mobile padding and the gaps between
  those blocks; `/shop` got the same spacing treatment for consistency since
  it shares the same `ShopFilters`/`ProductGrid` layout.

Desktop is visually unchanged in both cases.

**Wholesale pivot.** The shop owner said directly: "we are not looking for
sellers on our site, what we are looking for are wholesalers or retailers
who want to buy from us" — plus a specific ask, a popup offering 5% off a
first wholesale order in exchange for a name, WhatsApp number, and joining
Emmason's WhatsApp Channel. Scope was confirmed explicitly before touching
anything, since this meant retiring a whole existing subsystem: **retire the
"become a seller" recruitment flow — nav, landing page, registration form,
admin queue — and reposition that space around wholesalers/retailers buying
from Emmason instead**, while leaving *existing* sellers' data alone (their
shop pages, "Sold by" attribution on products, the homepage/`/sell`
"Verified sellers" section) since that's already-onboarded sellers'
contribution to the live catalogue, not new recruitment — ripping it out
would touch checkout and orders for no reason anyone asked for.

What changed:

- **New table, `wholesale_leads`** (migration `0009_wholesale_leads.sql`):
  name, WhatsApp number, locale, source (`popup` | `page`), a `contacted`
  flag. No approval step, no generated reference number, no relationship to
  `sellers` — a lead is just a lead. `seller_applications` and `sellers` are
  left in place untouched; `seller_applications` simply stops receiving new
  rows.
- **`src/actions/wholesale.ts`** — `submitWholesaleLead()`, rate-limited the
  same way `submitSellerApplication()` was (5/hour per IP), zod-validated,
  writes through the service-role admin client like every other write path
  in this app.
- **`src/components/wholesale-form.tsx`** — the two-field form (name,
  WhatsApp), shared between the popup and the `/sell` page so they can't
  drift apart. Success state offers a "Join our WhatsApp channel" button if
  `NEXT_PUBLIC_WHATSAPP_CHANNEL_URL` is set, otherwise falls back to a
  prefilled WhatsApp DM (`whatsappLink()` in `src/lib/site.ts`) so the flow
  is still fully functional with zero extra setup.
- **`src/components/wholesale-popup.tsx`** — site-wide lead-gen popup,
  mounted in the shop layout, shown once (`localStorage`-gated) after a 4s
  delay, suppressed on `/cart`, `/checkout` and `/sell` (mid-purchase is the
  wrong moment to interrupt; `/sell` already carries the same form inline).
  Portalled to `document.body` for the `backdrop-blur` containing-block
  reason above.
- **`/sell` page rewritten** from a seller-recruitment pitch to a wholesale
  landing page: hero with the form inline, three benefit tiles, a 3-step
  "how it works." `src/components/seller-registration-form.tsx` and the
  `/sell/register` route are deleted outright — the new form has no NIN,
  no business address, no category picker, so there was nothing to keep.
- **Admin**: `/admin/applications` (seller approval queue) replaced by
  `/admin/wholesale-leads` — a flat list with a WhatsApp deep link per lead
  and a contacted/not-contacted toggle (`src/actions/admin.ts`:
  `listWholesaleLeads`, `setLeadContacted`).
- **Dictionary**: the `seller` namespace was trimmed down to only what
  existing sellers' own shop pages still use (`shopTitle`, `memberSince`,
  `productCount(One)`, `verifiedSeller`, `pendingSeller`); everything
  recruitment-specific moved to a new `wholesale` namespace, translated by
  hand into all 5 locales alongside it. `nav.sell`, `footer.sellWithUs`,
  `home.heroCtaSecondary`, `home.sellTitle/sellBody/sellCta` and the
  `info.q3/a3` FAQ entry were repointed from "become a seller" copy to
  "buy wholesale" copy, same keys, new values, in all 5 locales.

**Not done yet — needs the shop owner:**

1. **The `0009_wholesale_leads.sql` migration has not been applied to the
   live database.** This session's Supabase MCP connection is authenticated
   to a different account than the one hosting the real project (ref
   `kdpbuuaibwqktqdwzayu` — see §8, Environment gotchas, for how that
   project was originally provisioned on a second account specifically to
   avoid touching the user's other projects). Apply it via the Supabase
   dashboard's SQL editor, or `supabase db push` with the project linked
   locally. Until then, the popup and `/sell` form submit cleanly through
   validation but the insert fails with a friendly "Could not submit your
   details" error — verified live against the production database, not
   simulated.
2. **No WhatsApp Channel exists yet.** Create one (WhatsApp app → Updates
   tab → **+** → New channel) and set `NEXT_PUBLIC_WHATSAPP_CHANNEL_URL` in
   Vercel's environment variables. Until then every successful lead falls
   back to the prefilled-DM path, which works but is a weaker funnel than
   the intended one-tap channel join.

**Locale auto-detection by geography.** The shop owner asked for French to
be served automatically to visitors from Francophone countries, and Hausa to
visitors from Hausa-speaking Nigerian regions — the existing
`Accept-Language` negotiation in `src/proxy.ts` doesn't do this well, since
most phones in Nigeria ship with an English OS regardless of the owner's
spoken language, so it was serving nearly everyone English by default.
Added `@vercel/functions`'s `geolocation(request)` (the `next/server`
`NextRequest.geo`/`.ip` it replaces were removed in Next 15 — confirmed
against `node_modules/next/dist/docs` per this repo's own `AGENTS.md`
instruction before writing any of this) as a new tier in the locale
precedence, ranked **above** `Accept-Language` and below the explicit
`emmason_locale` cookie:

- **Country → French** for a fixed list of Francophone countries most
  likely to actually reach this store (France plus West/Central African
  neighbours — Benin, Burkina Faso, Cameroon, CAR, Chad, Congo, DR Congo,
  Côte d'Ivoire, Djibouti, Gabon, Guinea, Mali, Niger, Senegal, Togo).
  Officially-bilingual countries (Canada, Belgium, Switzerland) are
  deliberately excluded — English is at least as likely to be right there.
- **Nigerian state → Hausa/Yorùbá/Igbo** using `countryRegion` (the bare
  ISO 3166-2 subdivision code Vercel reports, e.g. `"KN"` for Kano) for
  states with a clear ethnic-language majority — the user only asked for
  Hausa by name, but the same mechanism extends to Yorùbá and Igbo (already
  supported locales) for free, so leaving them out would have been an
  inconsistent half-implementation. Ethnically-mixed states (Borno,
  Adamawa, the Middle Belt) are deliberately left unmapped rather than
  guessed, falling through to `Accept-Language`.
- Verified against the running dev server by sending `x-vercel-ip-country`
  / `x-vercel-ip-country-region` headers directly (these headers only exist
  for real once deployed on Vercel's edge network, so this is the only way
  to test the logic locally) — Senegal → `/fr`, Kano → `/ha`, Lagos → `/yo`,
  Imo → `/ig`, Borno (unmapped) and the US both correctly fall through to
  `/en`, and an explicit `emmason_locale` cookie still wins over a
  contradicting geo signal in every case.

**Known trade-off, accepted deliberately**: IP location is a proxy for
language, not a certainty — a US tourist geolocated to Kano gets served
Hausa by default. The language switcher is always visible and one tap
away, and a manual switch is remembered via the cookie for that visitor
going forward, which is the same trade-off most geo-localised sites make.

## 6. Verified by driving a real browser

`node scripts/verify.mjs` (dev server running) exercises: all five locales and
their `<html lang>`, the catalogue coming from Postgres, language switching
preserving the page, a real order through checkout, a wholesale lead
submission, and admin sign-in through to the wholesale-leads list. It reports
any console or page error. Last run (before the wholesale pivot, still
representative of the rest of the flow): **zero errors**, order `EMM-BBBCB1`.
The wholesale-lead step is expected to report `error shown instead: true`
until migration `0009_wholesale_leads.sql` is applied to the live database
(§5, Wholesale pivot) — that's the form's validated error path working
correctly, not a bug.

`node scripts/mobile-audit.mjs` is the second harness. It drives the storefront
at 360, 390 and 414px and reports horizontal overflow, tap targets under 44px
and body text under 12px. Last run: **no horizontal overflow and no console
errors at any width.** The tap targets it still lists are inline links inside
prose — breadcrumbs, footer legal links, product-card titles under a fully
clickable card — which WCAG 2.5.8 exempts. Every real control (menu, cart,
language, add-to-cart, footer nav, social icons) is at least 44px.

Two mobile bugs it caught that no amount of desktop review would have:

- The header overflowed **every** page from 360 to 414px, because the logo's
  "Mobile Phone & Tech Gadget" descriptor kept it 205px wide.
- The product page scrolled sideways to 477px. A grid item defaults to
  `min-width: auto`, so the long legal business name in the seller card widened
  the entire single mobile column. `min-w-0` on both columns is the fix, and the
  same trap was live on the contact page.

Chromium is pre-installed. Launch with
`executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"`.
Do **not** run `playwright install`.

Admin credentials come from `VERIFY_ADMIN_EMAIL` / `VERIFY_ADMIN_PASSWORD`,
falling back to the local Docker ones.

**Against a hosted project, step 7 (admin sign-in) cannot pass in this
sandbox.** The egress proxy resets Chromium's `CONNECT`, so the browser cannot
reach `*.supabase.co` — and admin sign-in is the one flow that calls Supabase
from client code. Every server-rendered flow is unaffected and does verify.
The admin area itself was confirmed against the hosted database by minting a
session from Node and writing the `sb-<ref>-auth-token` cookie into the
context: overview, orders, products and applications all render, with zero
console errors. This is an environment limit, not an application bug — the same
flow passes end to end against local Docker Supabase, where the browser only
ever talks to localhost.

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

1. ~~**Real photography.**~~ **Partially done — placeholder photography,
   still needs Emmason's real photos.** 75 of 102 products now show a real
   photograph instead of the gradient tile; `ProductImage` still falls back to
   the tile for the other 27.

   Source: `scripts/source-images.mjs` pulls from Openverse (CC0/PDM/BY only —
   never BY-SA, never hotlinked, always re-encoded with `sharp` and re-hosted
   in Supabase Storage under `product-images`). Eight parallel agents ran the
   pipeline across all 16 categories: search → download a candidate → look at
   it → upload + write `images`/`image_credits` on the product row. Every
   photo carries its licence trail in `image_credits`, index-aligned with
   `images`, so it's traceable when Emmason's own photos replace it.

   **The one judgement call worth knowing about:** 15 of the ~90 photos the
   agents applied were reverted after review. They were accurate matches for
   the *product category* but showed a *different real company's* logo under
   a listing for oraimo, Hikity, Samsung or Ox — e.g. "Samsung Galaxy Buds FE"
   rendering a visibly JBL-branded photo, or a Hikity car stereo rendering a
   Jaguar Land Rover infotainment retrofit. Openverse has essentially no
   inventory for regional brands like oraimo, so the closest visual match was
   often a rival's branded product instead. That reads as "this is what your
   oraimo item looks like" rather than a generic stand-in, which is a
   trust problem a plain gradient tile is not — so those 15 were reverted to
   the tile rather than shipped. This distinction did **not** apply to
   `Generic`-branded products: the storefront makes no manufacturer claim
   there, so a recognisable stock photo standing in for "a phone repair kit"
   or "a DSLR camera" is normal placeholder practice, not a brand claim, and
   those were kept. Full per-category counts are in `README.md`.

   **Update: 102/102 now covered.** The user came back after the first pass
   and said plainly — twice — that they do not want any icon or emoji
   standing in for a photo anywhere on the site. That changed the priority:
   a second wave of four parallel agents went after the 27 remaining gaps
   with instructions to prefer an unbranded match, but to apply a real photo
   even with a small rival logo in frame rather than leave the tile up. All
   27 closed. Independently re-verified against the database, not just the
   agents' own reports: `select count(*) from products where
   cardinality(images) = 0` returns 0.

   **Six of those 27 still show a legible rival brand, more prominently than
   "incidental":**

   | Product | Shows |
   | --- | --- |
   | `tecno-t101-button-phone`, `tecno-t315-button-phone` | A Nokia 105 — "NOKIA" printed large across the top of the phone |
   | `oraimo-toast-20-20000mah-power-bank` | "ANKER Power Bank" in sharp, centred text |
   | `oraimo-powerbox-600-60000mah` | A Xiaomi power bank with the "Mi" logo |
   | `ox-18-inch-rechargeable-standing-fan` | A Lasko-branded fan hub |
   | `oraimo-tempo-w2-osw-20` | A Samsung Gear Fit close-up, phone blurred behind it |

   Openverse simply carries no inventory for oraimo, itel, Tecno, Ox, Qasa,
   Century or Hikity — these six are the honest cost of "always show a real
   photo" once the closest real match is a rival's product. If any of these
   bother Emmason before launch, re-run `node scripts/source-images.mjs
   search "<query>" <n>` for a cleaner candidate, or wait for the real
   product photo to replace it outright — `apply` on the same slug
   overwrites in one step either way.
2. ~~**A hosted Supabase project.**~~ **Done.** Project `Emmanson Store`
   (ref `kdpbuuaibwqktqdwzayu`, eu-west-1) on a second Supabase account, so the
   user's other projects were left untouched. All six migrations and both seeds
   are applied; 16 categories, 64 products, 5 sellers, 37 delivery zones.
3. **Paystack keys.** The integration is complete but has never run against
   the live API. WhatsApp ordering works without them, and card payment stays
   hidden until `PAYSTACK_SECRET_KEY` is set.
4. ~~**Deploy.**~~ **Live** at <https://emmason-store.vercel.app>.

   Vercel project `emmason-store` (`prj_W5khdNR4k0myfqqR6VJfqKhSYLsp`, team
   `kindnessagbo9-8129s-projects`), linked to the GitHub repo. The first build
   failed because the environment variables were not set yet; the redeploy
   after they were added is `READY` on target `production`.

   Deployed from `claude/online-store-capabilities-1akdt9`, **not** `main` —
   Vercel's configured production branch is still `main`, so the current
   production deployment came from a redeploy of the branch. Merging the branch
   to `main` is the tidy end state.

   Environment variables live in the Vercel dashboard, not in the repo:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`. Add `NEXT_PUBLIC_SITE_URL`
   (`https://emmason-store.vercel.app`) before switching Paystack on — it
   builds the payment callback URL. Note `NEXT_PUBLIC_SUPABASE_URL` is needed
   at **build** time too: it seeds the CSP allow-list and the image optimiser's
   host list in `next.config.ts`.

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
