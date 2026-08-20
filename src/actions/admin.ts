"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
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

const PRODUCT_IMAGES_BUCKET = "product-images";

// Mirrors the compression settings in scripts/source-images.mjs: this is a
// mobile-first storefront (see docs/adr/0002), so photos are re-encoded to a
// bounded JPEG rather than stored at whatever resolution a phone camera or
// staff laptop produced them at.
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_JPEG_QUALITY = 82;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // raw upload cap, before compression

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Compress and store one staff-uploaded product photo, called once per file
 * picked in the product form. The form collects the resulting public URLs
 * client-side and folds them into the same newline-joined string
 * `saveProduct` already expects, so the stored `images` shape is unchanged.
 */
export async function uploadProductImage(formData: FormData): Promise<UploadImageResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file received" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: `${file.name || "That file"} isn't an image` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `${file.name || "That file"} is too large (max 15MB)` };
  }

  const raw = Buffer.from(await file.arrayBuffer());

  let compressed: Buffer;
  try {
    compressed = await sharp(raw)
      .rotate() // respect EXIF orientation before it's stripped
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch {
    return { ok: false, error: `${file.name || "That file"} doesn't look like a valid image` };
  }

  const objectPath = `uploads/${randomUUID()}.jpg`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, compressed, { contentType: "image/jpeg", upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);
  return { ok: true, url: data.publicUrl };
}

/**
 * Best-effort cleanup when staff remove a photo from the picker before
 * saving — otherwise the compressed object (uploaded eagerly on pick) sits
 * in Storage forever with nothing pointing at it. A no-op for URLs this
 * bucket didn't create (e.g. legacy externally-hosted photos), and failures
 * here are swallowed: an orphaned object is a storage-hygiene issue, never a
 * reason to block the admin from editing the product.
 */
export async function deleteProductImage(url: string): Promise<void> {
  await requireAdmin();

  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return;

  const objectPath = url.slice(markerIndex + marker.length);
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([objectPath]);
}

/**
 * The product form serializes its merged template + custom spec fields into
 * one hidden JSON field (see product-form.tsx) rather than one form field
 * per spec key, since the set of keys is dynamic (depends on category and
 * how many custom rows staff added). Parse it defensively: a missing,
 * malformed, or empty-keyed/valued entry just drops out rather than failing
 * the whole save, since this is server-side validation of a client-built
 * payload, not something a staff member fills in directly.
 */
const specsSchema = z
  .string()
  .optional()
  .transform((raw): Record<string, string> => {
    if (!raw) return {};
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {};
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .map(([key, value]): [string, string] => [key.trim(), String(value ?? "").trim()])
        .filter(([key, value]) => key.length > 0 && value.length > 0),
    );
  });

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
  // Real Supabase Storage public URLs run ~100+ chars each; a 2000-char cap
  // would silently fail a save once a product carried more than ~15 photos.
  imageUrls: z.string().trim().max(20000).optional().or(z.literal("")),
  specs: specsSchema,
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
    specs: (formData.get("specs") as string) || undefined,
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
    specs: data.specs,
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
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/product/${data.slug}`);
  return { ok: true };
}

/**
 * Quick stock correction from the products table, without opening the full
 * editor. Routed through log_stock_movement (as an adjustment) rather than
 * writing products.stock directly — otherwise this path would silently
 * bypass the Stock Movement ledger and its "full history" guarantee.
 */
export async function adjustStock(
  productId: string,
  stock: number,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Stock must be zero or a whole number" };
  }

  const supabase = createSupabaseAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!current) return { ok: false, error: "Product not found" };

  const delta = stock - current.stock;
  if (delta !== 0) {
    const { error } = await supabase.rpc("log_stock_movement", {
      p_product_id: productId,
      p_type: "adjustment",
      p_quantity: delta,
      p_unit_cost_kobo: null,
      p_note: "Quick correction from the products list",
      p_logged_by: admin.id,
    });

    if (error) return { ok: false, error: error.message };
  }

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
