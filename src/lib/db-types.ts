/**
 * Database row shapes.
 *
 * `src/lib/types.ts` holds the *domain* types the storefront renders — prices
 * in whole Naira, copy already localised. These are the raw table shapes:
 * money in kobo, localised copy still as jsonb. The mapping between the two
 * happens in `src/lib/data/index.ts` and nowhere else.
 *
 * Admin tooling works against these directly, because it edits records rather
 * than displaying a shopfront.
 */

export type OrderChannel = "paystack" | "whatsapp";

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type FulfilmentMethod = "pickup" | "delivery";
export type PaymentMethodDb = "on-delivery" | "transfer" | "card";
export type ProductCondition = "new" | "uk-used" | "refurbished";

/**
 * A product's lifecycle: `pending_review` (captured by the field app, never
 * approved), `published` (live on the storefront), `unpublished` (was live,
 * since taken down). See CONTEXT.md — Product Status.
 */
export type ProductStatus = "pending_review" | "published" | "unpublished";

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  name_i18n: Record<string, string>;
  tagline_i18n: Record<string, string>;
  glyph: string | null;
  gradient: string[];
  sort_order: number;
  is_active: boolean;
}

export interface DbProduct {
  id: string;
  category_id: string;
  seller_id: string | null;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  description_i18n: Record<string, string>;
  price_kobo: number;
  compare_at_price_kobo: number | null;
  condition: ProductCondition;
  stock: number;
  sku: string | null;
  images: string[];
  specs: Record<string, string>;
  warranty_months: number | null;
  rating: number;
  review_count: number;
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSeller {
  id: string;
  slug: string;
  name: string;
  bio: Record<string, string>;
  city: string;
  state: string;
  since: number | null;
  verified: boolean;
  is_house: boolean;
  rating: number;
  review_count: number;
  phone: string | null;
}

export interface DeliveryZone {
  id: string;
  state: string;
  fee_kobo: number;
  eta_days: string;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  image_snapshot: string | null;
  unit_price_kobo: number;
  quantity: number;
  line_total_kobo: number;
}

export interface Order {
  id: string;
  reference: string;
  channel: OrderChannel;
  status: OrderStatus;
  fulfilment: FulfilmentMethod;
  payment_method: PaymentMethodDb;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_state: string | null;
  delivery_city: string | null;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  total_kobo: number;
  paystack_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/** See CONTEXT.md — Stock Movement, Restock, Sale, Adjustment. */
export type StockMovementType = "restock" | "sale" | "adjustment";

export interface StockMovementRow {
  id: string;
  product_id: string;
  type: StockMovementType;
  /**
   * Signed delta this movement applied to `products.stock`: positive for a
   * Restock, either sign for an Adjustment, negative for a Sale. See
   * docs/adr/0001-stock-movement-as-audit-trail.md.
   */
  quantity: number;
  unit_cost_kobo: number | null;
  note: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface WholesaleLeadRow {
  id: string;
  name: string;
  whatsapp: string;
  locale: string | null;
  source: string;
  contacted: boolean;
  created_at: string;
}
