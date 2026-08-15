-- Marketplace + internationalisation.
--
-- Brings the schema up to what the storefront actually is: a five-language
-- marketplace with third-party sellers, not a single-language single-seller
-- shop.
--
-- Localised copy is stored as jsonb keyed by locale — {"en": "...", "yo": "..."}
-- — rather than one column per language, so adding a sixth locale later is a
-- data change rather than a migration.

-- ---------------------------------------------------------------------------
-- Sellers
-- ---------------------------------------------------------------------------
create table if not exists public.sellers (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  bio          jsonb not null default '{}'::jsonb,
  city         text not null,
  state        text not null,
  since        integer,
  verified     boolean not null default false,
  -- Emmason's own stock, as opposed to a third-party listing.
  is_house     boolean not null default false,
  rating       numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  phone        text,
  created_at   timestamptz not null default now()
);

create index if not exists sellers_verified_idx on public.sellers (verified) where verified;

-- Only one seller may be the house account.
create unique index if not exists sellers_single_house_idx
  on public.sellers ((true)) where is_house;

-- ---------------------------------------------------------------------------
-- Categories gain localised names and their tile styling.
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists name_i18n    jsonb not null default '{}'::jsonb,
  add column if not exists tagline_i18n jsonb not null default '{}'::jsonb,
  add column if not exists glyph        text,
  add column if not exists gradient     text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Products gain a seller, a condition and localised descriptions.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.product_condition as enum ('new', 'uk-used', 'refurbished');
exception when duplicate_object then null; end $$;

alter table public.products
  add column if not exists seller_id        uuid references public.sellers (id) on delete restrict,
  add column if not exists condition        public.product_condition not null default 'new',
  add column if not exists description_i18n jsonb not null default '{}'::jsonb,
  -- [{"label": {"en": "Battery", ...}, "value": "20,000mAh"}]
  add column if not exists specs_i18n       jsonb not null default '[]'::jsonb,
  add column if not exists rating           numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  add column if not exists review_count     integer not null default 0 check (review_count >= 0);

create index if not exists products_seller_idx on public.products (seller_id) where is_active;
create index if not exists products_condition_idx on public.products (condition) where is_active;

-- ---------------------------------------------------------------------------
-- Orders gain fulfilment method and payment method.
--
-- Pickup is free and needs no address, so the delivery columns become
-- conditionally optional — enforced by a check rather than by nullability, so
-- a delivery order still cannot be saved without somewhere to deliver to.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.fulfilment_method as enum ('pickup', 'delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('on-delivery', 'transfer', 'card');
exception when duplicate_object then null; end $$;

alter table public.orders
  add column if not exists fulfilment     public.fulfilment_method not null default 'delivery',
  add column if not exists payment_method public.payment_method not null default 'on-delivery';

alter table public.orders alter column delivery_address drop not null;
alter table public.orders alter column delivery_state   drop not null;

alter table public.orders drop constraint if exists orders_delivery_needs_address;
alter table public.orders add constraint orders_delivery_needs_address check (
  fulfilment = 'pickup'
  or (delivery_address is not null and delivery_state is not null)
);

-- ---------------------------------------------------------------------------
-- Seller applications — the marketplace onboarding queue.
--
-- NIN is stored masked only (last three digits). The full number is validated
-- in the form and deliberately never persisted, so a database leak cannot
-- expose anyone's national identity number.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.application_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.seller_applications (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,
  status        public.application_status not null default 'pending',
  business_name text not null,
  contact_name  text not null,
  phone         text not null,
  email         text not null,
  address       text not null,
  city          text not null,
  state         text not null,
  -- e.g. "••••••••901" — never the full 11 digits.
  nin_masked    text,
  categories    text[] not null default '{}',
  about         text,
  review_notes  text,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists seller_applications_status_idx
  on public.seller_applications (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Delivery pricing knobs that were previously hard-coded in the frontend.
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id                          boolean primary key default true check (id),
  free_delivery_threshold_kobo integer not null default 15000000,
  updated_at                  timestamptz not null default now()
);

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS + grants for the new tables, matching the existing posture.
-- ---------------------------------------------------------------------------
alter table public.sellers             enable row level security;
alter table public.seller_applications enable row level security;
alter table public.store_settings      enable row level security;

drop policy if exists "sellers are publicly readable" on public.sellers;
create policy "sellers are publicly readable"
  on public.sellers for select to anon, authenticated using (true);

drop policy if exists "admins manage sellers" on public.sellers;
create policy "admins manage sellers"
  on public.sellers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "store settings are publicly readable" on public.store_settings;
create policy "store settings are publicly readable"
  on public.store_settings for select to anon, authenticated using (true);

-- Applications contain personal contact details: staff only, never public.
drop policy if exists "admins read applications" on public.seller_applications;
create policy "admins read applications"
  on public.seller_applications for select to authenticated using (public.is_admin());

drop policy if exists "admins update applications" on public.seller_applications;
create policy "admins update applications"
  on public.seller_applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.sellers        to anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant insert, update, delete on public.sellers to authenticated;
grant select, update on public.seller_applications to authenticated;
grant all on public.sellers, public.seller_applications, public.store_settings to service_role;
