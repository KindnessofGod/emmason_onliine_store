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

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  price_kobo: number;
  compare_at_price_kobo: number | null;
  stock: number;
  sku: string | null;
  images: string[];
  specs: Record<string, string>;
  warranty_months: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/** A product joined with its category, as returned by the catalogue queries. */
export interface ProductWithCategory extends Product {
  category: Pick<Category, "id" | "slug" | "name">;
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
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  delivery_state: string;
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

/** What the browser sends at checkout. Deliberately carries no prices. */
export interface CartLine {
  productId: string;
  quantity: number;
}

/** A cart line hydrated with catalogue data for display. */
export interface CartLineDetail extends CartLine {
  product: Product;
  lineTotalKobo: number;
}
