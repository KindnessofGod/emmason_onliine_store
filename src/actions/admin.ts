"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { cancelOrder, updateOrderStatus } from "@/lib/orders";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { WholesaleLeadRow } from "@/lib/db-types";
import { nairaToKobo } from "@/lib/money";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
    const flat = z.flattenError(parsed.error);
    return {
      ok: false,
      error:
        Object.values(flat.fieldErrors).flat()[0] ??
        "Please check the form and try again.",
    };
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
