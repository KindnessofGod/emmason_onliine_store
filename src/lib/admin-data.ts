import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { DbCategory, DbProduct, ProductStatus } from "@/lib/db-types";

export interface DashboardStats {
  ordersToday: number;
  ordersAwaiting: number;
  revenuePaidKobo: number;
  lowStock: { id: string; name: string; slug: string; stock: number }[];
  outOfStockCount: number;
  productCount: number;
}

/** Everything the admin overview needs, in one pass. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createSupabaseAdminClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [ordersResult, productsResult] = await Promise.all([
    supabase.from("orders").select("status, total_kobo, created_at"),
    supabase.from("products").select("id, name, slug, stock").eq("status", "published"),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (productsResult.error) throw productsResult.error;

  const orders = ordersResult.data ?? [];
  const products = productsResult.data ?? [];

  const paidStatuses = new Set(["paid", "processing", "shipped", "delivered"]);

  return {
    ordersToday: orders.filter(
      (order) => new Date(order.created_at) >= startOfToday,
    ).length,
    ordersAwaiting: orders.filter(
      (order) => order.status === "awaiting_payment" || order.status === "pending",
    ).length,
    revenuePaidKobo: orders
      .filter((order) => paidStatuses.has(order.status))
      .reduce((total, order) => total + order.total_kobo, 0),
    lowStock: products
      .filter((product) => product.stock > 0 && product.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8),
    outOfStockCount: products.filter((product) => product.stock === 0).length,
    productCount: products.length,
  };
}

export interface AdminProductRow extends DbProduct {
  category_name: string;
}

export async function listAdminProducts(options?: {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
}): Promise<AdminProductRow[]> {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("products")
    .select("*, categories (name)")
    .order("name");

  if (options?.categoryId) query = query.eq("category_id", options.categoryId);
  if (options?.status) query = query.eq("status", options.status);
  if (options?.search) {
    const safe = options.search.replace(/[,()\\]/g, " ");
    query = query.or(`name.ilike.%${safe}%,sku.ilike.%${safe}%,brand.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { categories, ...product } = row as DbProduct & {
      categories: { name: string } | null;
    };
    return { ...product, category_name: categories?.name ?? "—" };
  });
}

export async function getAdminProduct(id: string): Promise<DbProduct | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as DbProduct | null;
}

/** Categories as raw rows, for the admin editor's category picker. */
export async function listAdminCategories(): Promise<DbCategory[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as DbCategory[];
}
