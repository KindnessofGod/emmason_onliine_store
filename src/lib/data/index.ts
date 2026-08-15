import type { Condition, Product } from "../types";
import { categories, getCategory } from "./categories";
import { getProduct, getProductById, products } from "./products";
import { getSeller, getSellerBySlug, sellers } from "./sellers";

export { categories, getCategory } from "./categories";
export { products, getProduct, getProductById } from "./products";
export { sellers, getSeller, getSellerBySlug } from "./sellers";

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
 * The single read path for product listings. Every page goes through here, so
 * swapping the seed arrays for a database means rewriting this function only.
 */
export function queryProducts(query: ProductQuery = {}): Product[] {
  const { category, seller, condition, minPrice, maxPrice, search, sort = "featured" } = query;

  let result = products.slice();

  if (category) result = result.filter((p) => p.categorySlug === category);
  if (seller) result = result.filter((p) => p.sellerId === seller);
  if (condition) result = result.filter((p) => p.condition === condition);
  if (typeof minPrice === "number") result = result.filter((p) => p.price >= minPrice);
  if (typeof maxPrice === "number") result = result.filter((p) => p.price <= maxPrice);

  if (search) {
    const needle = search.trim().toLowerCase();
    if (needle) {
      result = result.filter((p) => {
        const cat = getCategory(p.categorySlug);
        const haystack = [
          p.name,
          p.brand,
          p.categorySlug,
          ...(cat ? Object.values(cat.name) : []),
          ...Object.values(p.description),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });
    }
  }

  switch (sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
      break;
    default:
      result.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.rating - a.rating;
      });
  }

  return result;
}

export function featuredProducts(limit = 8): Product[] {
  return products
    .filter((p) => p.featured)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function newArrivals(limit = 8): Product[] {
  return products
    .slice()
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit);
}

export function onSaleProducts(limit = 8): Product[] {
  return products
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .sort(
      (a, b) =>
        (b.compareAtPrice! - b.price) / b.compareAtPrice! -
        (a.compareAtPrice! - a.price) / a.compareAtPrice!,
    )
    .slice(0, limit);
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  );
  const fallback = products.filter(
    (p) => p.categorySlug !== product.categorySlug && p.id !== product.id,
  );
  return [...sameCategory, ...fallback].slice(0, limit);
}

export function productCountByCategory(slug: string): number {
  return products.filter((p) => p.categorySlug === slug).length;
}

export function productCountBySeller(sellerId: string): number {
  return products.filter((p) => p.sellerId === sellerId).length;
}

export function verifiedSellers() {
  return sellers.filter((s) => s.verified);
}

/** Resolves the cart's product ids in one pass. Unknown ids are dropped. */
export function hydrateCart(lines: Array<{ productId: string; quantity: number }>) {
  return lines.flatMap((line) => {
    const product = getProductById(line.productId);
    return product ? [{ product, quantity: line.quantity }] : [];
  });
}

export const priceBounds = {
  min: Math.min(...products.map((p) => p.price)),
  max: Math.max(...products.map((p) => p.price)),
};

export { getSeller as sellerById, getSellerBySlug as sellerBySlug };
export { categories as allCategories, sellers as allSellers, products as allProducts };
export { getProduct as productBySlug, getProductById as productById };
