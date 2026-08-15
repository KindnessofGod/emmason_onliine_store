-- Atomic order placement.
--
-- The cart the browser sends is a list of product ids and quantities — never
-- prices. Prices, stock checks and the delivery fee are all resolved here from
-- the database inside one transaction, so a tampered cart cannot change what
-- the customer is charged, and two shoppers racing for the last unit cannot
-- both win it.

create or replace function public.place_order(
  p_channel          public.order_channel,
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_email   text,
  p_delivery_address text,
  p_delivery_state   text,
  p_delivery_city    text,
  p_notes            text,
  -- [{"product_id": "uuid", "quantity": 2}, ...]
  p_items            jsonb
)
returns table (
  order_id  uuid,
  reference text,
  total_kobo integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id      uuid;
  v_reference     text;
  v_subtotal      integer := 0;
  v_delivery_fee  integer;
  v_item          jsonb;
  v_product       public.products%rowtype;
  v_quantity      integer;
  v_line_total    integer;
  v_attempts      integer := 0;
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Cart is empty' using errcode = 'check_violation';
  end if;

  -- Delivery fee for the destination state.
  select fee_kobo into v_delivery_fee
  from public.delivery_zones
  where state = p_delivery_state and is_active;

  if v_delivery_fee is null then
    raise exception 'We do not deliver to % yet', p_delivery_state
      using errcode = 'check_violation';
  end if;

  -- Generate a short, human-quotable reference. Built from gen_random_uuid()
  -- rather than pgcrypto's gen_random_bytes: uuid generation is core Postgres,
  -- whereas pgcrypto lives in the `extensions` schema on Supabase and so is
  -- invisible to this function's pinned search_path.
  -- Retry on the vanishingly unlikely collision rather than failing checkout.
  loop
    v_reference := 'EMM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders o where o.reference = v_reference);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not allocate an order reference';
    end if;
  end loop;

  insert into public.orders (
    reference, channel, status,
    customer_name, customer_phone, customer_email,
    delivery_address, delivery_state, delivery_city,
    subtotal_kobo, delivery_fee_kobo, total_kobo, notes
  ) values (
    v_reference, p_channel,
    case when p_channel = 'paystack' then 'awaiting_payment'::public.order_status
         else 'pending'::public.order_status end,
    p_customer_name, p_customer_phone, nullif(p_customer_email, ''),
    p_delivery_address, p_delivery_state, nullif(p_delivery_city, ''),
    0, v_delivery_fee, 0, nullif(p_notes, '')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity < 1 then
      raise exception 'Invalid quantity for product %', v_item ->> 'product_id'
        using errcode = 'check_violation';
    end if;

    -- FOR UPDATE serialises concurrent buyers of the same product.
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'Product % is no longer available', v_item ->> 'product_id'
        using errcode = 'no_data_found';
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Only % of % left in stock', v_product.stock, v_product.name
        using errcode = 'check_violation';
    end if;

    v_line_total := v_product.price_kobo * v_quantity;
    v_subtotal   := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id, product_id, name_snapshot, image_snapshot,
      unit_price_kobo, quantity, line_total_kobo
    ) values (
      v_order_id, v_product.id, v_product.name,
      nullif(v_product.images[1], ''),
      v_product.price_kobo, v_quantity, v_line_total
    );

    -- Reserve the stock now; release it again if the order is cancelled.
    update public.products
    set stock = stock - v_quantity
    where id = v_product.id;
  end loop;

  update public.orders
  set subtotal_kobo = v_subtotal,
      total_kobo    = v_subtotal + v_delivery_fee
  where id = v_order_id;

  return query
  select v_order_id, v_reference, v_subtotal + v_delivery_fee;
end;
$$;

-- Cancelling an order returns its reserved stock to the shelf. Guarded so that
-- repeated cancellation cannot inflate inventory.
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
begin
  select status into v_status
  from public.orders where id = p_order_id
  for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  if v_status in ('cancelled', 'refunded') then
    return;  -- already released
  end if;

  update public.products p
  set stock = p.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;

  update public.orders
  set status = 'cancelled',
      notes  = coalesce(notes || E'\n', '') || coalesce('Cancelled: ' || p_reason, 'Cancelled')
  where id = p_order_id;
end;
$$;

-- The catalogue-facing functions run as the definer; make sure the anon role
-- cannot call them directly. All invocation happens server-side.
revoke all on function public.place_order(
  public.order_channel, text, text, text, text, text, text, text, jsonb
) from anon, authenticated;

revoke all on function public.cancel_order(uuid, text) from anon, authenticated;
