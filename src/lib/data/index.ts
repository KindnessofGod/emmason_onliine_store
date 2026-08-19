import "server-only";

import { createSupabaseCatalogClient } from "@/lib/supabase/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { specLabel } from "./spec-labels";
import type {
  Category,
  Condition,
  LocalizedText,
  Product,
  Seller,
} from "../types";

export { specLabel } from "./spec-labels";

/**
 * The read path for the whole catalogue.
 *
 * Everything the storefront renders comes through this module. The seed arrays
 * that used to live here have moved into Postgres (supabase/seed.sql), but the
 * exported shapes are unchanged, so page components did not have to be
 * rewritten — only awaited.
 *
 * One conversion happens here and nowhere else: the database stores money as
 * integer kobo (which is what Paystack expects and what keeps totals exact),
 * while the UI works in whole Naira. `toNaira` is the single boundary.
 */

const PRODUCT_COLUMNS = `
  id, slug, name, brand, category_id, seller_id, price_kobo, compare_at_price_kobo,
  condition, stock, warranty_months, rating, review_count, is_featured, created_at,
  description, description_i18n, specs, images,
  categories!inner (slug),
  sellers (id, slug, name)
`;

const CATEGORY_COLUMNS =
  "id, slug, name, description, name_i18n, tagline_i18n, glyph, gradient, sort_order";

const SELLER_COLUMNS =
  "id, slug, name, bio, city, state, since, verified, is_house, rating, review_count";

function toNaira(kobo: number): number {
  return Math.round(kobo / 100);
}

/**
 * Fill every locale from a partial jsonb blob, falling back to English (and
 * then to a plain string) so a half-translated row still renders.
 */
function localize(
  value: unknown,
  fallback: string | null | undefined,
): LocalizedText {
  const source = (value ?? {}) as Record<string, unknown>;
  const base =
    typeof source[defaultLocale] === "string"
      ? (source[defaultLocale] as string)
      : (fallback ?? "");

  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      typeof source[locale] === "string" && source[locale] ? source[locale] : base,
    ]),
  ) as LocalizedText;
}

/** DB specs are a flat {label: value} map with English keys. Translate the
 *  label through the shared table when we know it, otherwise show it as-is. */
function toSpecs(specs: unknown): Product["specs"] {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];

  const known = specLabel as Record<string, LocalizedText | undefined>;

  return Object.entries(specs as Record<string, unknown>).map(([label, value]) => {
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, "");
    return {
      label: known[key] ?? localize(null, label),
      value: String(value),
    };
  });
}

type ProductRow = Record<string, unknown> & {
  categories: { slug: string } | null;
  sellers: { id: string; slug: string; name: string } | null;
};

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    brand: (row.brand as string) ?? "",
    categorySlug: row.categories?.slug ?? "",
    sellerId: (row.seller_id as string) ?? "",
    sellerSlug: row.sellers?.slug ?? "",
    sellerName: row.sellers?.name ?? "",
    price: toNaira(row.price_kobo as number),
    compareAtPrice: row.compare_at_price_kobo
      ? toNaira(row.compare_at_price_kobo as number)
      : undefined,
    condition: (row.condition as Condition) ?? "new",
    stock: (row.stock as number) ?? 0,
    warrantyMonths: (row.warranty_months as number) ?? 0,
    rating: Number(row.rating ?? 0),
    reviewCount: (row.review_count as number) ?? 0,
    featured: Boolean(row.is_featured),
    addedAt: String(row.created_at ?? "").slice(0, 10),
    description: localize(row.description_i18n, row.description as string),
    specs: toSpecs(row.specs),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
  };
}

function rowToCategory(row: Record<string, unknown>): Category {
  const gradient = (row.gradient as string[]) ?? [];
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: localize(row.name_i18n, row.name as string),
    tagline: localize(row.tagline_i18n, row.description as string),
    glyph: (row.glyph as string) ?? "🛍️",
    gradient: [gradient[0] ?? "#2F5C19", gradient[1] ?? "#63B824"],
  };
}

function rowToSeller(row: Record<string, unknown>): Seller {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    bio: localize(row.bio, ""),
    city: (row.city as string) ?? "",
    state: (row.state as string) ?? "",
    since: (row.since as number) ?? new Date().getFullYear(),
    verified: Boolean(row.verified),
    isHouse: Boolean(row.is_house),
    rating: Number(row.rating ?? 0),
    reviewCount: (row.review_count as number) ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Categories and sellers
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map(rowToCategory);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToCategory(data) : undefined;
}

export async function getSellers(): Promise<Seller[]> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("sellers")
    .select(SELLER_COLUMNS)
    .order("is_house", { ascending: false })
    .order("name");

  if (error) throw error;
  return (data ?? []).map(rowToSeller);
}

export async function getSellerBySlug(slug: string): Promise<Seller | undefined> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("sellers")
    .select(SELLER_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToSeller(data) : undefined;
}

export async function getSeller(id: string): Promise<Seller | undefined> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("sellers")
    .select(SELLER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToSeller(data) : undefined;
}

export async function verifiedSellers(): Promise<Seller[]> {
  return (await getSellers()).filter((seller) => seller.verified);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export interface ProductQuery {
  category?: string;
  seller?: string;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: SortKey;
}

/**
 * The single read path for product listings. Filtering, sorting and search all
 * happen in Postgres rather than in JavaScript, so this stays cheap as the
 * catalogue grows past the seed.
 */
export async function queryProducts(query: ProductQuery = {}): Promise<Product[]> {
  const { category, seller, condition, minPrice, maxPrice, search, sort = "featured" } =
    query;

  const supabase = createSupabaseCatalogClient();
  let request = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true);

  if (category) request = request.eq("categories.slug", category);
  if (seller) request = request.eq("seller_id", seller);
  if (condition) request = request.eq("condition", condition);
  if (typeof minPrice === "number") request = request.gte("price_kobo", minPrice * 100);
  if (typeof maxPrice === "number") request = request.lte("price_kobo", maxPrice * 100);

  if (search?.trim()) {
    // Escape the PostgREST `or` delimiters so punctuation in the search box
    // cannot break out of the filter expression.
    const safe = search.trim().replace(/[,()\\]/g, " ");
    request = request.or(
      `name.ilike.%${safe}%,brand.ilike.%${safe}%,description.ilike.%${safe}%`,
    );
  }

  switch (sort) {
    case "price-asc":
      request = request.order("price_kobo", { ascending: true });
      break;
    case "price-desc":
      request = request.order("price_kobo", { ascending: false });
      break;
    case "newest":
      request = request.order("created_at", { ascending: false });
      break;
    default:
      request = request
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(row as unknown as ProductRow));
}

export async function allProducts(): Promise<Product[]> {
  return queryProducts();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProduct(data as unknown as ProductRow) : undefined;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProduct(data as unknown as ProductRow) : undefined;
}

export async function featuredProducts(limit = 8): Promise<Product[]> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .eq("is_featured", true)
    .gt("stock", 0)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(row as unknown as ProductRow));
}

export async function newArrivals(limit = 8): Promise<Product[]> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => rowToProduct(row as unknown as ProductRow));
}

/** Discounted stock, deepest discount first. */
export async function onSaleProducts(limit = 8): Promise<Product[]> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .not("compare_at_price_kobo", "is", null)
    .limit(200);

  if (error) throw error;

  // Discount depth is a ratio between two columns, which PostgREST cannot
  // order by directly, so rank the discounted subset here.
  return (data ?? [])
    .map((row) => rowToProduct(row as unknown as ProductRow))
    .filter((product) => product.compareAtPrice && product.compareAtPrice > product.price)
    .sort(
      (a, b) =>
        (b.compareAtPrice! - b.price) / b.compareAtPrice! -
        (a.compareAtPrice! - a.price) / a.compareAtPrice!,
    )
    .slice(0, limit);
}

export async function relatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = await queryProducts({ category: product.categorySlug });
  const related = sameCategory.filter((item) => item.id !== product.id);

  if (related.length >= limit) return related.slice(0, limit);

  // Thin category — pad from the wider catalogue rather than showing a gap.
  const rest = (await queryProducts()).filter(
    (item) => item.id !== product.id && item.categorySlug !== product.categorySlug,
  );
  return [...related, ...rest].slice(0, limit);
}

async function countProducts(column: string, value: string): Promise<number> {
  const supabase = createSupabaseCatalogClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq(column, value);

  if (error) throw error;
  return count ?? 0;
}

export async function productCountByCategory(slug: string): Promise<number> {
  const category = await getCategory(slug);
  return category ? countProducts("category_id", category.id) : 0;
}

export async function productCountBySeller(sellerId: string): Promise<number> {
  return countProducts("seller_id", sellerId);
}

/** Cheapest and dearest live prices, for the shop's price filter bounds. */
export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const supabase = createSupabaseCatalogClient();

  const [low, high] = await Promise.all([
    supabase
      .from("products")
      .select("price_kobo")
      .eq("is_active", true)
      .order("price_kobo", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("price_kobo")
      .eq("is_active", true)
      .order("price_kobo", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    min: toNaira(low.data?.price_kobo ?? 0),
    max: toNaira(high.data?.price_kobo ?? 0),
  };
}

/** Free-delivery threshold, in whole Naira, from store settings. */
export async function getFreeDeliveryThreshold(fallback: number): Promise<number> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("free_delivery_threshold_kobo")
    .maybeSingle();

  if (error || !data) return fallback;
  return toNaira(data.free_delivery_threshold_kobo);
}

/** Delivery fee for a state, in whole Naira. Null when we do not ship there. */
export async function getDeliveryFee(state: string): Promise<number | null> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("fee_kobo")
    .eq("state", state)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return toNaira(data.fee_kobo);
}

export async function getDeliveryZones(): Promise<
  { state: string; fee: number; eta: string }[]
> {
  const supabase = createSupabaseCatalogClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("state, fee_kobo, eta_days")
    .eq("is_active", true)
    .order("state");

  if (error) throw error;
  return (data ?? []).map((zone) => ({
    state: zone.state,
    fee: toNaira(zone.fee_kobo),
    eta: zone.eta_days,
  }));
}

// Aliases kept so existing page imports continue to resolve.
export { getSellerBySlug as sellerBySlug, getSeller as sellerById };
export { getCategories as allCategories, getSellers as allSellers };
export { getProduct as productBySlug, getProductById as productById };
