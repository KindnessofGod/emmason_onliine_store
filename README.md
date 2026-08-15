# Emmason — multilingual electronics marketplace

Storefront and seller marketplace for **Emmason Mobile Phones, Tech & Gadgets**
(No 24 Day Star Plaza, Owerri). Customers buy directly; verified third-party
sellers list alongside the house catalogue.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

## Languages

Five locales, each a full translation — not machine-filled stubs:

| Code | Language |
| ---- | -------- |
| `en` | English |
| `yo` | Yorùbá |
| `ig` | Igbo |
| `ha` | Hausa |
| `fr` | Français |

Every route is locale-prefixed (`/yo/shop`, `/ha/product/nokia-150-4g`). A
visitor landing on `/` is redirected by `src/proxy.ts`, which prefers the
`emmason_locale` cookie set by the language switcher and otherwise negotiates
from `Accept-Language`. Switching language keeps you on the same page.

English is the source of truth: `src/lib/i18n/dictionaries/en.ts` defines the
`Dictionary` type, and the other four are typed against it — a missing or
misspelled key fails `npm run typecheck` rather than rendering blank.

Counts use `pluralize()` (one/other), which is enough for English and French;
Yoruba, Igbo and Hausa do not inflect these nouns.

## What works

**Shopping** — category browsing, search, filters (category, condition, price)
and sorting, all held in the URL so a filtered listing is shareable. Product
pages carry specs, warranty, seller attribution and Product JSON-LD.

**Cart & checkout** — cart persists in `localStorage`. Checkout collects contact
details, offers **store pickup** (free) or **nationwide delivery** (₦3,500 flat,
free over ₦150,000), and three payment methods. Validation covers Nigerian phone
formats and email, with errors announced via `aria-invalid` / `aria-describedby`.

**Marketplace** — seller landing page, and a registration form capturing business
details, category coverage and **NIN** for identity verification. The NIN is
validated as 11 digits and masked (`••••••••901`) the moment it leaves the form;
it is never rendered in full or written to a log. Applications are gated on admin
approval before a seller can list.

## Data layer

There is no database yet. The catalogue is seeded in `src/lib/data/` and read
through a single function, `queryProducts()` in `src/lib/data/index.ts`. That is
the intended swap point: replacing the seed arrays with real queries there leaves
every page unchanged.

Three places currently stop short of a backend, each marked with a comment:

- **Checkout** derives an order reference locally instead of POSTing an order.
- **Seller registration** confirms locally instead of persisting an application.
- **Newsletter** confirms locally instead of calling a mailing-list provider.

Product imagery is also seeded: `ProductImage` renders a branded gradient tile
per category rather than a broken `<img>`. Swap it for `next/image` when real
photography exists.

## Layout

```
src/
  app/[locale]/        routes — home, shop, category, product, cart, checkout,
                       deals, sell, sell/register, seller, about, contact, policies
  components/          header, footer, cart, checkout, filters, product cards, icons
  lib/
    i18n/              locale config, dictionaries, interpolate/pluralize helpers
    data/              seeded catalogue, sellers, categories, query layer
    nigeria.ts         states list, phone/email/NIN validation, NIN masking
    format.ts          Naira formatting, discounts, order references
    site.ts            business address, phone numbers, socials, delivery pricing
  proxy.ts             locale negotiation and redirect
```

## Notes

- Prices are whole Naira integers; `formatPrice()` handles display per locale.
- The design tokens (brand greens, the red sale flash) live in
  `src/app/globals.css` under `@theme`, sampled from the shop's print artwork.
- `prefers-reduced-motion` is respected globally.
