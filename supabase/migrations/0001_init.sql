-- Emmason Online Store — core schema
-- Money is stored as integer kobo (1 naira = 100 kobo) to avoid floating point drift.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists categories_sort_idx on public.categories (sort_order, name);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  category_id           uuid not null references public.categories (id) on delete restrict,
  slug                  text not null unique,
  name                  text not null,
  brand                 text,
  description           text,
  -- Selling price in kobo. 45000 naira => 4500000.
  price_kobo            integer not null check (price_kobo >= 0),
  -- Optional "was" price for showing a discount. Must exceed the selling price.
  compare_at_price_kobo integer check (compare_at_price_kobo is null or compare_at_price_kobo > price_kobo),
  stock                 integer not null default 0 check (stock >= 0),
  sku                   text unique,
  images                text[] not null default '{}',
  -- Free-form spec sheet, e.g. {"Battery": "20000mAh", "Ports": "USB-C, 2x USB-A"}
  specs                 jsonb not null default '{}'::jsonb,
  warranty_months       integer check (warranty_months is null or warranty_months >= 0),
  is_active             boolean not null default true,
  is_featured           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id) where is_active;
create index if not exists products_featured_idx on public.products (is_featured) where is_active and is_featured;
-- Trigram index powers the storefront search box (name + brand).
create extension if not exists "pg_trgm";
create index if not exists products_search_idx
  on public.products using gin ((name || ' ' || coalesce(brand, '')) gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Delivery zones — flat fee per Nigerian state.
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_zones (
  id         uuid primary key default gen_random_uuid(),
  state      text not null unique,
  fee_kobo   integer not null check (fee_kobo >= 0),
  eta_days   text not null default '2-4 working days',
  is_active  boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.order_channel as enum ('paystack', 'whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',    -- created, nothing confirmed yet
    'awaiting_payment',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  -- Human-quotable reference shown to the customer, e.g. EMM-7F3K2Q.
  reference           text not null unique,
  channel             public.order_channel not null,
  status              public.order_status not null default 'pending',

  customer_name       text not null,
  customer_phone      text not null,
  customer_email      text,

  delivery_address    text not null,
  delivery_state      text not null,
  delivery_city       text,

  subtotal_kobo       integer not null check (subtotal_kobo >= 0),
  delivery_fee_kobo   integer not null default 0 check (delivery_fee_kobo >= 0),
  total_kobo          integer not null check (total_kobo >= 0),

  paystack_reference  text unique,
  paid_at             timestamptz,
  notes               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (customer_phone);

-- ---------------------------------------------------------------------------
-- Order items — price and name are snapshotted so historic orders stay
-- correct after the catalogue is edited.
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  name_snapshot   text not null,
  image_snapshot  text,
  unit_price_kobo integer not null check (unit_price_kobo >= 0),
  quantity        integer not null check (quantity > 0),
  line_total_kobo integer not null check (line_total_kobo >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Admins — a row here grants access to /admin. Keyed to Supabase auth users.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();
