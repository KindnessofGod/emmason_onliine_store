# EMMASON Gadgets online store

An online store for consumer electronics and phone accessories, priced in
naira and delivered across Nigeria. Customers can pay by card, bank transfer
or USSD through Paystack, or send their order to WhatsApp and settle it there.

Built with Next.js 16 (App Router), Supabase (Postgres + Auth) and Tailwind v4.

---

## Running it locally

You need Node 20+ and Docker.

```bash
npm install
npx supabase start          # Postgres, PostgREST and Auth in Docker
cp .env.example .env.local  # then fill in the values printed by supabase start
npm run dev
```

`supabase start` applies everything in `supabase/migrations/` and then seeds
the sample catalogue from `supabase/seed.sql` — 16 categories, 64 products and
37 delivery zones.

If some of the optional containers fail to start in a restricted environment,
the app only needs the core four:

```bash
npx supabase start -x edge-runtime,studio,imgproxy,inbucket,realtime,storage-api,supavisor,vector
```

### Creating the first admin

Admin access is granted by a row in `public.admins`, keyed to a Supabase auth
user. Nothing in the UI can grant it — that is deliberate.

```bash
# 1. Create the auth user (swap in your own email and password)
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"…","email_confirm":true}'

# 2. Add the returned id to the roster
insert into public.admins (user_id, email)
values ('<returned-id>', 'you@example.com');
```

Then sign in at `/admin/login`.

---

## How the money works

Every amount is stored as an **integer number of kobo** (₦1 = 100 kobo) and
converted to naira only at the moment of display. No arithmetic anywhere
touches a floating point number, so totals cannot drift by a kobo.

Paystack also denominates NGN in kobo, so amounts pass to it unconverted.

## How an order is placed

The browser's cart holds **product ids and quantities only — never prices**.
At checkout it is sent to `place_order()` (see
`supabase/migrations/0003_place_order.sql`), which inside a single transaction:

1. looks up the delivery fee for the destination state,
2. locks each product with `SELECT … FOR UPDATE`,
3. reads the real price and checks stock,
4. writes the order and its line items with the price snapshotted,
5. decrements stock to reserve it.

Two consequences worth knowing: a tampered cart cannot change what a customer
is charged, and two shoppers racing for the last unit cannot both get it.

Cancelling an order (`cancel_order()`) returns the reserved stock, and is
guarded so repeat cancellation cannot inflate inventory.

## Payment confirmation

An order is only marked paid on evidence from Paystack, never on the strength
of a browser redirect:

- **Webhook** (`/api/paystack/webhook`) — the `x-paystack-signature` header is
  verified as an HMAC-SHA512 of the raw body, compared in constant time. The
  handler then independently calls Paystack's verify endpoint rather than
  trusting the payload, and refuses to fulfil an underpayment.
- **Return page** (`/order/[reference]`) — verifies too, as a fallback for when
  the webhook is slow. Marking paid is idempotent, so both paths can race
  safely.

Point your Paystack dashboard webhook at
`https://your-domain/api/paystack/webhook`.

## Security posture

- Row Level Security denies by default. The anon key can read the live
  catalogue and nothing else; it cannot read a single order.
- Every write goes through server-side code holding the service role key,
  which never reaches the browser.
- `supabase/migrations/0004_grants.sql` states table privileges explicitly
  rather than relying on Supabase's implicit defaults, so the schema behaves
  the same on a hosted project, a local stack or CI.

---

## Layout

```
src/
  app/
    (store)/          customer-facing pages, with the store header and footer
    admin/            staff dashboard, its own chrome, gated by middleware
    api/paystack/     webhook receiver
  actions/            server actions: cart pricing, checkout, admin writes
  lib/                data access, money, Paystack, WhatsApp, auth helpers
  components/         UI, with admin components under components/admin
supabase/
  migrations/         schema, RLS, order functions, grants
  seed.sql            sample catalogue
```

## Environment variables

See `.env.example`. The ones that matter in production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Used to build the Paystack callback URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits only, e.g. `2348012345678` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS |
| `PAYSTACK_SECRET_KEY` | Server only. Also verifies webhook signatures |

## Current state

The catalogue is sample data — real names, plausible naira prices, no photos.
Products render a generated placeholder tile until image URLs are added
through the admin panel, so nothing appears broken in the meantime.
