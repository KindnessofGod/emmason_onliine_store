import type { StockMovementType } from "@/lib/db-types";

/** Single source of truth for how each Stock Movement type is labelled in the admin UI. */
export const STOCK_MOVEMENT_TYPES: {
  value: StockMovementType;
  label: string;
  description: string;
}[] = [
  { value: "restock", label: "Restock", description: "goods newly taken in" },
  { value: "sale", label: "Sale", description: "decremented automatically by an order" },
  { value: "adjustment", label: "Adjustment", description: "damage, loss, or a miscount" },
];

export function stockMovementLabel(type: StockMovementType): string {
  return STOCK_MOVEMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}
