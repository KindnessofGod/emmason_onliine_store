-- Wholesale lead capture.
--
-- Emmason is not recruiting third-party sellers any more — the storefront's
-- "Sell on Emmason" flow (registration form, NIN check, admin approval queue)
-- is retired in the same change that adds this table. What replaces it is
-- much smaller: a wholesale/retail buyer leaves their name and WhatsApp
-- number (from the homepage popup or the /sell page) to claim 5% off their
-- first bulk order and get added to Emmason's WhatsApp channel. There is no
-- approval step — every submission is just a lead for staff to follow up on
-- WhatsApp, so this table is intentionally much flatter than
-- seller_applications was.
--
-- seller_applications and sellers are left in place, untouched: existing
-- sellers already contribute real products to the live catalogue (seller
-- shop pages, "Sold by" attribution, checkout) and retiring recruitment of
-- *new* sellers does not require touching *existing* seller data.
create table if not exists public.wholesale_leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  whatsapp   text not null,
  -- Which locale they were browsing in and where the form was, purely so
  -- staff can tell "homepage popup" leads from "/sell page" leads later.
  locale     text,
  source     text not null default 'popup',
  contacted  boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wholesale_leads_created_idx
  on public.wholesale_leads (created_at desc);

create index if not exists wholesale_leads_uncontacted_idx
  on public.wholesale_leads (created_at desc) where not contacted;

alter table public.wholesale_leads enable row level security;

-- Same posture as every other write path in this app: the public form
-- submits through a server action holding the service-role key, which
-- bypasses RLS entirely, so no anon policy is needed here. Staff reads and
-- updates go through an authenticated admin session, gated by is_admin().
drop policy if exists "admins read wholesale leads" on public.wholesale_leads;
create policy "admins read wholesale leads"
  on public.wholesale_leads for select to authenticated using (public.is_admin());

drop policy if exists "admins update wholesale leads" on public.wholesale_leads;
create policy "admins update wholesale leads"
  on public.wholesale_leads for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, update on public.wholesale_leads to authenticated;
grant all on public.wholesale_leads to service_role;
