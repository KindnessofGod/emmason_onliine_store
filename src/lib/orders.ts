import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderWithItems } from "@/lib/types";

const ORDER_COLUMNS =
  "id, reference, channel, status, customer_name, customer_phone, customer_email, delivery_address, delivery_state, delivery_city, subtotal_kobo, delivery_fee_kobo, total_kobo, paystack_reference, paid_at, notes, created_at, updated_at";

export interface PlaceOrderInput {
  channel: "paystack" | "whatsapp";
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryState: string;
  deliveryCity: string | null;
  notes: string | null;
  items: { productId: string; quantity: number }[];
}

export interface PlacedOrder {
  orderId: string;
  reference: string;
  totalKobo: number;
}

/**
 * Create an order. Pricing, stock checks and the delivery fee are all resolved
 * inside a single database transaction (see the `place_order` migration), so
 * the cart the browser sent cannot influence what is charged.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_channel: input.channel,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_customer_email: input.customerEmail,
    p_delivery_address: input.deliveryAddress,
    p_delivery_state: input.deliveryState,
    p_delivery_city: input.deliveryCity,
    p_notes: input.notes,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Order could not be created");

  return {
    orderId: row.order_id,
    reference: row.reference,
    totalKobo: row.total_kobo,
  };
}

export async function getOrderByReference(
  reference: string,
): Promise<OrderWithItems | null> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("reference", reference)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "id, order_id, product_id, name_snapshot, image_snapshot, unit_price_kobo, quantity, line_total_kobo",
    )
    .eq("order_id", (order as Order).id);

  if (itemsError) throw itemsError;

  return { ...(order as Order), items: (items ?? []) as OrderItem[] };
}

/** Attach the Paystack transaction reference before redirecting to checkout. */
export async function attachPaystackReference(
  orderId: string,
  paystackReference: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ paystack_reference: paystackReference })
    .eq("id", orderId);

  if (error) throw error;
}

/**
 * Mark an order paid. Idempotent: the status guard means a webhook and a
 * callback arriving together cannot double-apply, and a late duplicate
 * webhook is a no-op.
 */
export async function markOrderPaid(
  paystackReference: string,
  paidAt: string | null,
): Promise<Order | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: paidAt ?? new Date().toISOString(),
    })
    .eq("paystack_reference", paystackReference)
    .in("status", ["pending", "awaiting_payment"])
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function listOrders(options?: {
  status?: string;
  limit?: number;
}): Promise<Order[]> {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) throw error;
}
