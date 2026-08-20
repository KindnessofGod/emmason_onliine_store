"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { cancelOrder, updateOrderStatus } from "@/lib/orders";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { WholesaleLeadRow } from "@/lib/db-types";
import { nairaToKobo } from "@/lib/money";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** The first field-level validation message, or a generic fallback. */
function firstFieldError<T>(error: z.ZodError<T>): string {
  const flat = z.flattenError(error);
  const messages = Object.values(flat.fieldErrors).flat() as string[];
  return messages[0] ?? "Please check the form and try again.";
}

/** Every admin view that shows a product's Stock, refreshed after a Stock Movement. */
function revalidateProductViews(productId: string): void {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

const ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = z.enum(ORDER_STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Unknown status" };

  try {
    // Cancelling goes through the RPC so reserved stock returns to the shelf.
    if (parsed.data === "cancelled") {
      await cancelOrder(orderId, "Cancelled by staff");
    } else {
      await updateOrderStatus(orderId, parsed.data);
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update the order",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

const productSchema = z.object({
  id: z.uuid().optional(),
  categoryId: z.uuid("Choose a category"),
  name: z.string().trim().min(3, "Name is too short").max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
    .max(200),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priceNaira: z.coerce.number().min(0, "Price cannot be negative"),
  compareAtNaira: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  imageUrls: z.string().trim().max(2000).optional().or(z.literal("")),
  warrantyMonths: z.coerce.number().int().min(0).max(120).optional(),
  status: z.enum(["pending_review", "published", "unpublished"]),
  isFeatured: z.boolean(),
});

function readProductForm(formData: FormData) {
  return {
    id: (formData.get("id") as string) || undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceNaira: String(formData.get("priceNaira") ?? "0"),
    compareAtNaira: String(formData.get("compareAtNaira") ?? "") || undefined,
    stock: String(formData.get("stock") ?? "0"),
    sku: String(formData.get("sku") ?? ""),
    imageUrls: String(formData.get("imageUrls") ?? ""),
    warrantyMonths: String(formData.get("warrantyMonths") ?? "") || undefined,
    status: String(formData.get("status") ?? "published"),
    isFeatured: formData.get("isFeatured") === "on",
  };
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(readProductForm(formData));
  if (!parsed.success) {
    return { ok: false, error: firstFieldError(parsed.error) };
  }

  const data = parsed.data;
  const priceKobo = nairaToKobo(data.priceNaira);
  const compareAtKobo = data.compareAtNaira
    ? nairaToKobo(data.compareAtNaira)
    : null;

  // The database enforces this too; catching it here gives a readable message.
  if (compareAtKobo !== null && compareAtKobo <= priceKobo) {
    return {
      ok: false,
      error: "The 'was' price must be higher than the selling price.",
    };
  }

  const supabase = createSupabaseAdminClient();

  // Pending review only exists for a product's first appearance (see
  // CONTEXT.md — Product Status). Once a product has been published or
  // unpublished it has already passed review, so an edit can never route it
  // back into pending_review — a malformed submission just leaves the
  // existing status alone instead.
  let status = data.status;
  if (data.id) {
    const { data: existing } = await supabase
      .from("products")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (existing && existing.status !== "pending_review" && status === "pending_review") {
      status = existing.status;
    }
  }

  const row = {
    category_id: data.categoryId,
    name: data.name,
    slug: data.slug,
    brand: data.brand || null,
    description: data.description || null,
    price_kobo: priceKobo,
    compare_at_price_kobo: compareAtKobo,
    stock: data.stock,
    sku: data.sku || null,
    images: (data.imageUrls ?? "")
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean),
    warranty_months: data.warrantyMonths ?? null,
    status,
    is_featured: data.isFeatured,
  };

  const { error } = data.id
    ? await supabase.from("products").update(row).eq("id", data.id)
    : await supabase.from("products").insert(row);

  if (error) {
    const message = error.message.includes("duplicate key")
      ? "That slug or SKU is already used by another product."
      : error.message;
    return { ok: false, error: message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/product/${data.slug}`);
  return { ok: true };
}

/** Quick stock correction from the products table, without opening the editor. */
export async function adjustStock(
  productId: string,
  stock: number,
): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Stock must be zero or a whole number" };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", productId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { ok: true };
}

const restockSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero"),
  unitCostNaira: z.coerce.number().min(0, "Cost cannot be negative").optional(),
  note: z.string().trim().max(500).optional(),
});

/**
 * Log a Restock: goods newly taken in, with quantity and cost per unit. Goes
 * through the log_stock_movement RPC so the products.stock update and the
 * Stock Movement row are written atomically (see 0011_stock_movements.sql).
 */
export async function logRestock(
  productId: string,
  quantity: number,
  unitCostNaira?: number,
  note?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = restockSchema.safeParse({ productId, quantity, unitCostNaira, note });
  if (!parsed.success) return { ok: false, error: firstFieldError(parsed.error) };

  const data = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("log_stock_movement", {
    p_product_id: data.productId,
    p_type: "restock",
    p_quantity: data.quantity,
    p_unit_cost_kobo:
      data.unitCostNaira !== undefined ? nairaToKobo(data.unitCostNaira) : null,
    p_note: data.note || null,
    p_logged_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidateProductViews(data.productId);
  return { ok: true };
}

const adjustmentSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, "Quantity cannot be zero"),
  reason: z.string().trim().min(3, "A reason is required").max(500),
});

/**
 * Log an Adjustment: a Stock correction for a reason other than a Restock or
 * a Sale — damage, loss, or a miscount. `quantity` is the signed delta (e.g.
 * -2 for two damaged units, +1 for a miscount that turned up an extra).
 */
export async function logAdjustment(
  productId: string,
  quantity: number,
  reason: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = adjustmentSchema.safeParse({ productId, quantity, reason });
  if (!parsed.success) return { ok: false, error: firstFieldError(parsed.error) };

  const data = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("log_stock_movement", {
    p_product_id: data.productId,
    p_type: "adjustment",
    p_quantity: data.quantity,
    p_unit_cost_kobo: null,
    p_note: data.reason,
    p_logged_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidateProductViews(data.productId);
  return { ok: true };
}

/** Wholesale leads, newest first. No approval step — just a CRM-lite list. */
export async function listWholesaleLeads(filter: "all" | "uncontacted" = "uncontacted") {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("wholesale_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "uncontacted") query = query.eq("contacted", false);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WholesaleLeadRow[];
}

/** Toggle whether staff have already reached out to a wholesale lead. */
export async function setLeadContacted(
  leadId: string,
  contacted: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("wholesale_leads")
    .update({ contacted })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/wholesale-leads");
  return { ok: true };
}
