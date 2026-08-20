-- Stock Movement ledger.
--
-- Per ADR-0001, `products.stock` stays the plain number that checkout and
-- every other read path already use directly; `stock_movements` is an
-- append-only audit trail beside it, not a replacement. `quantity` is the
-- signed delta the movement applied to stock (positive = stock went up,
-- negative = stock went down), so `new_stock = old_stock + quantity` and a
-- product's movement history always sums back to its current Stock. A
-- Restock's quantity is therefore always positive; an Adjustment's can be
-- either sign (a miscount can turn up either more or less stock than
-- expected); a Sale's is always negative (see ticket #7, not written yet —
-- `place_order` is untouched by this migration).
do $$ begin
  create type public.stock_movement_type as enum ('restock', 'sale', 'adjustment');
exception when duplicate_object then null; end $$;

create table if not exists public.stock_movements (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products (id) on delete cascade,
  type            public.stock_movement_type not null,
  -- Signed delta applied to products.stock; see note above.
  quantity        integer not null check (quantity <> 0),
  -- Cost per unit in kobo. Only Restock carries this.
  unit_cost_kobo  integer check (unit_cost_kobo is null or unit_cost_kobo >= 0),
  note            text,
  -- Which admin logged it. Null'd rather than blocked if the admin account is
  -- later removed — the movement itself is history and should not disappear.
  logged_by       uuid references public.admins (user_id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Powers the per-product history view, newest first.
create index if not exists stock_movements_product_idx
  on public.stock_movements (product_id, created_at desc);

alter table public.stock_movements enable row level security;

-- Same posture as every other table in this app: all real writes go through
-- server code holding the service-role key (via log_stock_movement below),
-- which bypasses RLS. This policy only covers staff reading the ledger from
-- an authenticated admin session.
drop policy if exists "admins read stock movements" on public.stock_movements;
create policy "admins read stock movements"
  on public.stock_movements for select
  to authenticated
  using (public.is_admin());

grant select on public.stock_movements to authenticated;
grant all on public.stock_movements to service_role;

-- ---------------------------------------------------------------------------
-- log_stock_movement: the one write path onto stock_movements. Updates
-- products.stock and inserts the movement row in the same transaction, so the
-- two can never be left out of sync by a partial failure (see
-- docs/adr/0001-stock-movement-as-audit-trail.md and the place_order /
-- cancel_order functions this follows the shape of).
-- ---------------------------------------------------------------------------
create or replace function public.log_stock_movement(
  p_product_id     uuid,
  p_type           public.stock_movement_type,
  p_quantity       integer,
  p_unit_cost_kobo integer default null,
  p_note           text default null,
  p_logged_by      uuid default null
)
returns table (
  movement_id uuid,
  new_stock   integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product     public.products%rowtype;
  v_new_stock   integer;
  v_movement_id uuid;
begin
  if p_quantity = 0 then
    raise exception 'Quantity cannot be zero' using errcode = 'check_violation';
  end if;

  if p_type = 'restock' and p_quantity < 0 then
    raise exception 'A restock quantity must be positive' using errcode = 'check_violation';
  end if;

  if p_type = 'sale' and p_quantity > 0 then
    raise exception 'A sale quantity must be negative' using errcode = 'check_violation';
  end if;

  -- Row-lock the product for the duration of the transaction, same as
  -- place_order, so two staff logging movements for the same product at once
  -- cannot both read a stale stock figure.
  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product % not found', p_product_id using errcode = 'no_data_found';
  end if;

  v_new_stock := v_product.stock + p_quantity;
  if v_new_stock < 0 then
    raise exception 'That would take % below zero stock (currently %)',
      v_product.name, v_product.stock
      using errcode = 'check_violation';
  end if;

  update public.products
  set stock = v_new_stock
  where id = p_product_id;

  insert into public.stock_movements (
    product_id, type, quantity, unit_cost_kobo, note, logged_by
  ) values (
    p_product_id, p_type, p_quantity, p_unit_cost_kobo, nullif(p_note, ''), p_logged_by
  )
  returning id into v_movement_id;

  return query select v_movement_id, v_new_stock;
end;
$$;

-- Called only from server code holding the service-role key, exactly like
-- place_order and cancel_order.
revoke all on function public.log_stock_movement(
  uuid, public.stock_movement_type, integer, integer, text, uuid
) from anon, authenticated;
