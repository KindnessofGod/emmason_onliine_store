import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Category,
  DeliveryZone,
  Product,
  ProductWithCategory,
} from "@/lib/types";

const PRODUCT_COLUMNS =
  "id, category_id, slug, name, brand, description, price_kobo, compare_at_price_kobo, stock, sku, images, specs, warranty_months, is_active, is_featured, created_at, updated_at";

const PRODUCT_WITH_CATEGORY =
  `${PRODUCT_COLUMNS}, category:categories!inner (id, slug, name)`;

export type ProductSort = "featured" | "price-asc" | "price-desc" | "newest";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, image_url, sort_order, is_active")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, image_url, sort_order, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Counts of in-catalogue products, keyed by category id. */
export async function getCategoryProductCounts(): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("category_id");

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function getProductsByCategory(
  categorySlug: string,
  sort: ProductSort = "featured",
): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_WITH_CATEGORY)
    .eq("categories.slug", categorySlug);

  query = applySort(query, sort);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_CATEGORY)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ProductWithCategory | null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_featured", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Product[];
}

/** Same category, excluding the product being viewed. */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category_id", categoryId)
    .neq("id", excludeProductId)
    .gt("stock", 0)
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function searchProducts(term: string): Promise<Product[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const supabase = await createSupabaseServerClient();
  // Escape the PostgREST `or` filter delimiters so a comma or parenthesis in
  // the search box cannot break out of the filter expression.
  const safe = trimmed.replace(/[,()\\]/g, " ");
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,description.ilike.%${safe}%`)
    .limit(48);

  if (error) throw error;
  return (data ?? []) as Product[];
}

/**
 * Hydrate a cart. The browser only ever stores product ids and quantities, so
 * this is where real prices enter the picture.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", ids);

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, state, fee_kobo, eta_days, is_active")
    .order("state");

  if (error) throw error;
  return data ?? [];
}

type Sortable = {
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => Sortable;
};

function applySort<T extends Sortable>(query: T, sort: ProductSort): T {
  switch (sort) {
    case "price-asc":
      return query.order("price_kobo", { ascending: true }) as T;
    case "price-desc":
      return query.order("price_kobo", { ascending: false }) as T;
    case "newest":
      return query.order("created_at", { ascending: false }) as T;
    case "featured":
    default:
      return query
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true }) as T;
  }
}
