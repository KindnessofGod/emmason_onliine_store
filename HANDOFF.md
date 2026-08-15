# Handoff — Emmason multilingual electronics marketplace

**Last updated:** 2026-08-15
**Repo:** `KindnessofGod/emmason_onliine_store`
**Working branch:** `claude/multilingual-electronics-marketplace-kj0jl0`
**HEAD:** `012d2a5` — "Build multilingual electronics marketplace storefront"
**Status:** pushed, working tree clean, build green, no open PR

Read this file top to bottom before touching code. Sections 1–2 are the goal and
the decisions already made; section 6 is the backlog.

---

## 1. What we are building and why

An online store **and** multi-seller marketplace for **Emmason Mobile Phones,
Tech & Gadgets** — a real shop at No 24 Day Star Plaza, opposite St. Peter's
Anglican Church, Owerri, Imo State.

The business sells consumer electronics: phones (new and UK/London-used),
headphones and audio, rechargeable and solar fans, power banks and inverters,
ring lights and content-creation gear, smart watches, accessories, home tech.
Phone numbers 0906 5755 314 and 0803 863 0197; TikTok `@emmasongadgets`;
Facebook "emmason Mobile Phones Tech & Gadgets".

Two things make it more than a plain storefront:

1. **It must speak several Nigerian languages**, not just English. The brand's
   own flyers already mix English, Pidgin ("No Wahala", "emmason dey for you")
   and Igbo ("Ndeewo nu anyi emeghegoo").
2. **It is a marketplace, not just Emmason's own catalogue.** Third-party sellers
   register, get verified, and list alongside the house stock. Customers can also
   buy directly from Emmason.

Delivery is nationwide, and customers can alternatively walk in and collect.

### The brief came in by voice and was partly garbled

The original request was a voice transcript with significant transcription
damage. Do not treat the raw wording as precise. The parts that were legible:
consumer electronics, several categories, multiple languages (English, Yoruba,
Igbo, plus one that transcribed as "fresh"), something about linking **NIN**,
sellers contacting the business, pickup, direct consumer purchase, and "it has to
have really good UI".

Ambiguities were resolved by asking the user directly. **Their answers are
binding requirements — do not relitigate them:**

| Question asked | User's answer |
| --- | --- |
| Which languages? | "Hausa and french" — i.e. English + Yoruba + Igbo + **Hausa** + **French** (5 total) |
| Single store or marketplace? | **Marketplace with seller onboarding** |
| Verification / fulfilment? | **Store pickup + nationwide delivery** (see NIN note below) |
| Backend? | **Next.js + local seeded data first**, not Supabase yet |

### ⚠️ The one open judgement call: NIN

The verification question was multi-select with three options. The user ticked
**only** "Store pickup + nationwide delivery". They did **not** tick "NIN
verification for sellers" or "Seller-to-business contact channel".

However, NIN was explicitly mentioned in their original voice message. So NIN
capture **was built anyway**, and this was flagged to the user in plain terms:
*"One thing I'm keeping that you didn't tick: you mentioned NIN in your original
message, so I'm including NIN capture in seller registration (masked,
admin-review gated). Easy to remove if you'd rather not."*

**The user has not yet responded to that flag.** Confirm with them before
building anything further on top of NIN. If they say drop it, the removal is
contained: `src/lib/nigeria.ts` (`isValidNin`, `maskNin`), the NIN section of
`src/components/seller-registration-form.tsx`, and the `nin` / `ninHelp` /
`invalidNin` keys in all five dictionaries.

The **seller-to-business contact channel was not built at all** — it was offered,
not selected. It is in the backlog as an open question, not as agreed work.

---

## 2. Decisions already made (don't re-derive these)

- **Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4.** No UI
  component library — everything is hand-built, so there is no third-party
  design system to fight.
- **Next was upgraded off 15.5.4**, which shipped with CVE-2025-66478. React,
  postcss and tailwind were bumped alongside. `npm audit` reports **0
  vulnerabilities** — keep it that way.
- **`src/middleware.ts` was renamed to `src/proxy.ts`** and the export renamed
  `middleware` → `proxy`. This is Next 16's convention; the old name warns.
- **The root layout lives at `src/app/[locale]/layout.tsx`.** There is
  deliberately **no `src/app/layout.tsx`** — this is the documented Next i18n
  pattern and is what lets `<html lang>` be set per locale. Adding one will break
  routing.
- **English is the source of truth for translations.** `dictionaries/en.ts`
  exports the `Dictionary` type via a `Widen<>` helper; the other four are typed
  `const xx: Dictionary = {...}`. A missing or misspelled key is a **typecheck
  failure**, not a blank render. Preserve this property when adding keys — add to
  `en.ts` first, then all four others.
- **Prices are whole Naira integers**, not kobo, not floats. `formatPrice()`
  renders them.
- **Filters and sort live in the URL**, not component state, so a filtered
  listing is shareable and survives refresh.
- **Product names are not translated** ("Nokia 150 4G" reads the same
  everywhere). Descriptions, category names, spec labels and all UI chrome are.
- **Spec labels are shared** in `src/lib/data/spec-labels.ts` rather than
  re-translated inline per product — this keeps the translation surface small.

---

## 3. Where things stand

### Getting running

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

Verified green at handoff: `npm run typecheck` clean, `npm run build` compiles
and prerenders **237 static pages** (100 product pages = 20 products × 5 locales,
plus categories, sellers, and static routes across all locales).

### Branches

| Branch | Purpose | State |
| --- | --- | --- |
| `main` | default branch | 1 commit behind our work; untouched |
| `claude/multilingual-electronics-marketplace-kj0jl0` | **the working branch** | pushed, = `origin/...`, clean |

All work goes on `claude/multilingual-electronics-marketplace-kj0jl0`. Push with
`git push -u origin claude/multilingual-electronics-marketplace-kj0jl0`.
**No pull request has been opened** — the user has not asked for one.

---

## 4. What is built

### Routes (all under `/[locale]/`, 5 locales each)

| Route | What it does |
| --- | --- |
| `/` | Hero, trust bar, 8 category tiles, on-sale grid, walk-in store panel, new arrivals, verified sellers, sell CTA |
| `/shop` | Full catalogue with filters + sort + search |
| `/category/[slug]` | Category landing with gradient header, filters locked to that category |
| `/product/[slug]` | Gallery, price/discount, seller attribution, buy box, specs table, delivery/pickup cards, related products, Product JSON-LD |
| `/cart` | Line items, quantity steppers, subtotal, delivery, free-delivery nudge |
| `/checkout` | Contact, pickup-vs-delivery, address, 3 payment methods, order summary, confirmation |
| `/deals` | Everything discounted, sorted by discount depth |
| `/sell` | Seller landing — benefits, 3-step how-it-works, verified seller list |
| `/sell/register` | Seller application form (business details, NIN, categories, terms) |
| `/seller/[slug]` | Public seller shop page with their listings |
| `/about`, `/contact` | Business info, address, phones, socials |
| `/delivery`, `/returns`, `/faq`, `/privacy`, `/terms` | Policy pages (real translated copy, FAQ has FAQPage JSON-LD) |
| `not-found` | 404 |

### Internationalisation

Five locales: `en`, `yo` (Yorùbá), `ig` (Igbo), `ha` (Hausa), `fr` (Français).

- Every route is locale-prefixed. `/` redirects via `src/proxy.ts`, which prefers
  the `emmason_locale` cookie (set by the switcher, 1 year) and otherwise
  negotiates from `Accept-Language` with q-value ranking.
- The language switcher swaps only the locale segment, so you stay on the same
  page. **Verified in a browser:** `/en/shop` → `/ha/shop`.
- ~242 message keys per locale, fully translated (not stubs). Yoruba and Igbo
  diacritics render correctly — confirmed by screenshot.
- `interpolate()` fills `{name}` placeholders. `pluralize()` picks one/other
  forms — enough for English and French; Yoruba, Igbo and Hausa don't inflect
  these nouns.

### Seeded data

**20 products, 8 categories, 5 sellers** in `src/lib/data/`. Categories: phones,
audio, fans, power, content-creation, wearables, accessories, home-tech. Sellers
include Emmason itself (`isHouse: true`) plus 4 third parties, one deliberately
unverified so the pending state is exercisable.

### Commerce behaviour

- Cart persists to `localStorage` (`emmason_cart_v1`), with a `ready` flag so SSR
  and first client render agree and the badge doesn't flash a wrong count.
- Delivery: **₦3,500 flat, free over ₦150,000**; store pickup always free.
  Configured in `src/lib/site.ts`.
- Validation: Nigerian phone formats (`0803…`, `+234…`, `234…`), email, and NIN
  (exactly 11 digits). Errors wire `aria-invalid` + `aria-describedby`, and
  submitting an invalid form moves focus to the first failing field.

### Verified by driving a real browser

Not just built — actually exercised end to end with Playwright:

- Product → add to cart → cart → checkout → place order. Confirmation renders,
  cart clears afterwards.
- Empty-form submit on both checkout and seller registration raises the right
  errors.
- Seller registration completes and shows the NIN masked as `••••••••901`.
- Singular/plural: a one-result category shows "1 product", not "1 products".
- Language switch preserves the page.
- Zero uncaught page errors across all of it.

### Three real bugs were found this way and fixed

1. **Order confirmation rendered off-screen.** The checkout form is taller than
   the viewport, so after submit the confirmation appeared above the retained
   scroll position and looked like a blank page. Fixed with a `scrollTo` effect
   in both `checkout-form.tsx` and `seller-registration-form.tsx`.
2. **"1 items".** Added `itemsOne` / `resultsCountOne` / `productCountOne` keys
   across all five dictionaries and a `pluralize()` helper.
3. **Insufficient contrast** of white text on the lighter category-tile
   gradients. Darkened the gradient stops and added a bottom scrim.

---

## 5. Architecture — the parts that matter

```
src/
  app/[locale]/        all routes; ROOT LAYOUT LIVES HERE (no src/app/layout.tsx)
  app/globals.css      @theme design tokens: brand greens, flash red, ink greys
  app/icon.svg         favicon
  components/          header, footer, cart, checkout, filters, cards, icons
  lib/
    i18n/config.ts     locale list, metadata for the switcher
    i18n/dictionaries/ en.ts is the source of truth; yo/ig/ha/fr typed against it
    i18n/index.ts      getDictionary, interpolate, pluralize, href
    data/index.ts      >>> queryProducts() — THE DATABASE SWAP POINT <<<
    data/products.ts   20 seeded products
    data/categories.ts 8 categories with per-locale names + gradients
    data/sellers.ts    5 sellers
    data/spec-labels.ts shared translated spec labels
    nigeria.ts         36 states + FCT, phone/email/NIN validation, NIN masking
    format.ts          Naira formatting, discount %, order references
    site.ts            address, phones, socials, delivery pricing
    types.ts           Product, Seller, Category, LocalizedText, etc.
  proxy.ts             locale negotiation + redirect (Next 16 name for middleware)
```

**The single most important file for the next phase is
`src/lib/data/index.ts`.** Every page reads products through `queryProducts()`.
Replacing the seed arrays with real database queries inside that one function
leaves every page component untouched. That was the whole point of the structure.

### Where the backend is missing (each marked with a code comment)

| Flow | Current behaviour | File |
| --- | --- | --- |
| Place order | Derives a reference locally, clears cart. **Nothing is persisted or sent.** | `components/checkout-form.tsx` |
| Seller application | Confirms locally with a reference. **Nothing is persisted.** | `components/seller-registration-form.tsx` |
| Newsletter | Confirms locally. No provider call. | `components/newsletter-form.tsx` |

### Product imagery does not exist

There is no photography. `components/product-image.tsx` renders a deterministic
branded tile per category — category gradient, category emoji, and the wave motif
from Emmason's flyers. It looks intentional rather than broken, but **it is the
most visible gap in the product.** Replace with `next/image` when real shots
exist. This is a content problem more than a code problem: ask the user for
photos.

---

## 6. What is NOT done — backlog, roughly prioritised

### Blocking a real launch

1. **Real photography.** Biggest visible gap. Needs the user to supply images.
2. **A database.** User chose seeded-data-first deliberately, so this is the
   agreed next step, not a defect. Supabase MCP tools are available in this
   environment. Swap inside `queryProducts()`.
3. **Order persistence + notification.** Orders currently evaporate. Emmason
   needs to actually receive them — email, WhatsApp, or a dashboard.
4. **Seller application persistence + an admin review queue.** Applications
   evaporate too. There is no way for Emmason to see or approve anyone.
5. **Payments.** Card payment is an option in the UI with no processor behind it.
   Paystack or Flutterwave is the norm in Nigeria. Pay-on-delivery and bank
   transfer work as-is because they are manual by nature.

### Significant missing features

6. **Seller dashboard.** Registration ends at "pending approval" with nothing
   behind it. A verified seller currently cannot log in, add a product, edit
   prices, or see orders. This is the largest missing slice of the marketplace
   promise, and the user's original message did mention "seller maintenance".
7. **Authentication.** No accounts for customers, sellers, or admin. Needed
   before 6 can exist.
8. **Seller-to-business contact channel.** Offered to the user, not selected, so
   not built. Confirm whether they want it — the original voice message hinted at
   it ("sellers contact business").
9. **Real reviews.** Ratings and review counts are seeded numbers. There is no
   way to leave a review.
10. **Order tracking.** Customer gets a reference number that leads nowhere.

### Polish

11. **Search is a naive substring match** over name, brand, category and
    description. Fine at 20 products; will need real indexing later.
12. **Stock is not decremented** on order — nothing is transactional yet.
13. **No tests.** Verification so far has been Playwright scripts run ad hoc from
    the scratchpad, not a committed suite. Worth committing a real Playwright
    setup.
14. **Nigerian Pidgin was offered as a locale and not selected.** The brand's own
    flyers speak Pidgin, so it may still be worth raising again.
15. **Product gallery is fake** — the four thumbnails on the product page are the
    same generated tile. Becomes real once photography lands.

---

## 7. Environment gotchas (these cost time — don't rediscover them)

- **Never run `pkill -f "next start"`.** The pattern matches the bash command's
  own command line and kills your shell mid-command. Use
  `kill $(lsof -ti:PORT)`, or just start on a different port.
- **Port 3000 had a phantom listener** that `lsof` could not see: `next start`
  logged `EADDRINUSE` and exited, yet `curl` still returned 200 from a stale
  process. Ports 3100 and 3200 were used instead. If 3000 behaves oddly, move
  ports rather than debugging it.
- **Rebuilding while a server is running serves stale chunks.** The browser shows
  "This page couldn't load" on client-side navigation while `curl` returns 200 —
  because the chunk hashes changed under the running server. Always restart the
  server after `next build`. This looked exactly like an app bug and was not one.
- **Playwright:** Chromium is pre-installed at `/opt/pw-browsers/chromium`. Launch
  with `chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`. Do
  **not** run `playwright install`.
- **Google Fonts is reachable** through the proxy — `Plus_Jakarta_Sans` via
  `next/font/google` resolves at build time.
- Verification scripts from this session live in the session scratchpad and are
  **not committed**. They will be gone in a new session; rewrite as needed, or
  better, commit a proper Playwright suite (backlog item 13).

---

## 8. Open questions for the user

1. **NIN** — keep it, or remove it? Flagged, not yet answered. See section 1.
2. **Product photography** — can they supply images? This gates the biggest
   visible improvement.
3. **Seller dashboard** — is a full seller portal in scope, or is
   "apply, we approve, we list it for you" the actual operating model? This
   changes the size of the next phase enormously.
4. **Payment processor** — Paystack, Flutterwave, or manual transfer only?
5. **Nigerian Pidgin** as a sixth locale?
6. **Domain and hosting** — Vercel MCP tools are available in this environment if
   they want it deployed.
