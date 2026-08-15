-- Row Level Security.
--
-- Posture: deny by default. The anon key may read the live catalogue and
-- nothing else. Every write (orders, stock decrements, catalogue edits) goes
-- through server-side code holding the service role key, which bypasses RLS.
-- The admin policies below are defence in depth for anything that ever reaches
-- the database on a normal authenticated session.

alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.admins         enable row level security;

-- Helper: is the caller a store admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- --------------------------------------------------------------------------
-- Public catalogue — readable by anyone, including logged-out shoppers.
-- --------------------------------------------------------------------------
drop policy if exists "categories are publicly readable" on public.categories;
create policy "categories are publicly readable"
  on public.categories for select
  to anon, authenticated
  using (is_active);

drop policy if exists "active products are publicly readable" on public.products;
create policy "active products are publicly readable"
  on public.products for select
  to anon, authenticated
  using (is_active);

drop policy if exists "delivery zones are publicly readable" on public.delivery_zones;
create policy "delivery zones are publicly readable"
  on public.delivery_zones for select
  to anon, authenticated
  using (is_active);

-- --------------------------------------------------------------------------
-- Admin write access to the catalogue.
-- --------------------------------------------------------------------------
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage delivery zones" on public.delivery_zones;
create policy "admins manage delivery zones"
  on public.delivery_zones for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Orders — never publicly readable. Customer order lookup is served by the
-- server using the reference, not by a client-side query.
-- --------------------------------------------------------------------------
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- Admins table — an admin may see the roster but not edit it. Granting admin
-- is deliberately a service-role-only operation.
-- --------------------------------------------------------------------------
drop policy if exists "admins read admin roster" on public.admins;
create policy "admins read admin roster"
  on public.admins for select
  to authenticated
  using (public.is_admin());
