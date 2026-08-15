-- place_order, revised for the marketplace.
--
-- Adds pickup-vs-delivery and the free-delivery threshold. The delivery fee is
-- now resolved *after* the line items are priced, because whether delivery is
-- free depends on the subtotal.

drop function if exists public.place_order(
  public.order_channel, text, text, text, text, text, text, text, jsonb
);

create or replace function public.place_order(
  p_channel          public.order_channel,
  p_fulfilment       public.fulfilment_method,
  p_payment_method   public.payment_method,
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
  order_id   uuid,
  reference  text,
  total_kobo integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id     uuid;
  v_reference    text;
  v_subtotal     integer := 0;
  v_delivery_fee integer := 0;
  v_threshold    integer;
  v_item         jsonb;
  v_product      public.products%rowtype;
  v_quantity     integer;
  v_line_total   integer;
  v_attempts     integer := 0;
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Cart is empty' using errcode = 'check_violation';
  end if;

  if p_fulfilment = 'delivery' then
    if p_delivery_address is null or btrim(p_delivery_address) = ''
       or p_delivery_state is null or btrim(p_delivery_state) = '' then
      raise exception 'A delivery address and state are required'
        using errcode = 'check_violation';
    end if;

    -- Confirm we actually deliver there before taking any money.
    if not exists (
      select 1 from public.delivery_zones
      where state = p_delivery_state and is_active
    ) then
      raise exception 'We do not deliver to % yet', p_delivery_state
        using errcode = 'check_violation';
    end if;
  end if;

  loop
    v_reference := 'EMM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders o where o.reference = v_reference);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not allocate an order reference';
    end if;
  end loop;

  insert into public.orders (
    reference, channel, status, fulfilment, payment_method,
    customer_name, customer_phone, customer_email,
    delivery_address, delivery_state, delivery_city,
    subtotal_kobo, delivery_fee_kobo, total_kobo, notes
  ) values (
    v_reference, p_channel,
    case when p_channel = 'paystack' then 'awaiting_payment'::public.order_status
         else 'pending'::public.order_status end,
    p_fulfilment, p_payment_method,
    p_customer_name, p_customer_phone, nullif(p_customer_email, ''),
    case when p_fulfilment = 'pickup' then null else p_delivery_address end,
    case when p_fulfilment = 'pickup' then null else p_delivery_state end,
    nullif(p_delivery_city, ''),
    0, 0, 0, nullif(p_notes, '')
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

    update public.products
    set stock = stock - v_quantity
    where id = v_product.id;
  end loop;

  -- Delivery fee, now that the subtotal is known. Pickup is always free, and
  -- a large enough basket ships free wherever it is going.
  if p_fulfilment = 'delivery' then
    select free_delivery_threshold_kobo into v_threshold
    from public.store_settings where id;

    if v_threshold is null or v_subtotal < v_threshold then
      select fee_kobo into v_delivery_fee
      from public.delivery_zones
      where state = p_delivery_state and is_active;
    end if;
  end if;

  v_delivery_fee := coalesce(v_delivery_fee, 0);

  update public.orders
  set subtotal_kobo     = v_subtotal,
      delivery_fee_kobo = v_delivery_fee,
      total_kobo        = v_subtotal + v_delivery_fee
  where id = v_order_id;

  return query
  select v_order_id, v_reference, v_subtotal + v_delivery_fee;
end;
$$;

revoke all on function public.place_order(
  public.order_channel, public.fulfilment_method, public.payment_method,
  text, text, text, text, text, text, text, jsonb
) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seller applications are submitted by the public, so this is the one write
-- path that anonymous visitors can trigger. It goes through a function rather
-- than a table grant so the shape and the reference are controlled here.
-- ---------------------------------------------------------------------------
create or replace function public.submit_seller_application(
  p_business_name text,
  p_contact_name  text,
  p_phone         text,
  p_email         text,
  p_address       text,
  p_city          text,
  p_state         text,
  p_nin_masked    text,
  p_categories    text[],
  p_about         text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference text;
  v_attempts  integer := 0;
begin
  loop
    v_reference := 'SEL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (
      select 1 from public.seller_applications a where a.reference = v_reference
    );
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not allocate an application reference';
    end if;
  end loop;

  insert into public.seller_applications (
    reference, business_name, contact_name, phone, email,
    address, city, state, nin_masked, categories, about
  ) values (
    v_reference, p_business_name, p_contact_name, p_phone, p_email,
    p_address, p_city, p_state, nullif(p_nin_masked, ''), p_categories,
    nullif(p_about, '')
  );

  return v_reference;
end;
$$;

revoke all on function public.submit_seller_application(
  text, text, text, text, text, text, text, text, text[], text
) from anon, authenticated;
