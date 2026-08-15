"use server";

import { getProductsByIds } from "@/lib/catalog";
import type { CartLine, CartLineDetail } from "@/lib/types";

export interface HydratedCart {
  lines: CartLineDetail[];
  subtotalKobo: number;
  /** Lines dropped because the product was delisted since it was added. */
  removedCount: number;
  /** Lines whose quantity was trimmed to the stock actually available. */
  adjusted: { name: string; requested: number; available: number }[];
}

/**
 * Turn the browser's list of ids and quantities into a priced cart.
 * Prices come from the database every time — the client never supplies them.
 */
export async function hydrateCart(lines: CartLine[]): Promise<HydratedCart> {
  const valid = lines.filter(
    (line) =>
      typeof line.productId === "string" &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0,
  );

  if (valid.length === 0) {
    return { lines: [], subtotalKobo: 0, removedCount: 0, adjusted: [] };
  }

  const products = await getProductsByIds(valid.map((line) => line.productId));
  const byId = new Map(products.map((product) => [product.id, product]));

  const detailed: CartLineDetail[] = [];
  const adjusted: HydratedCart["adjusted"] = [];
  let removedCount = 0;

  for (const line of valid) {
    const product = byId.get(line.productId);

    if (!product) {
      removedCount += 1;
      continue;
    }

    if (product.stock === 0) {
      removedCount += 1;
      continue;
    }

    const quantity = Math.min(line.quantity, product.stock);
    if (quantity < line.quantity) {
      adjusted.push({
        name: product.name,
        requested: line.quantity,
        available: product.stock,
      });
    }

    detailed.push({
      productId: product.id,
      quantity,
      product,
      lineTotalKobo: product.price_kobo * quantity,
    });
  }

  return {
    lines: detailed,
    subtotalKobo: detailed.reduce((total, line) => total + line.lineTotalKobo, 0),
    removedCount,
    adjusted,
  };
}
