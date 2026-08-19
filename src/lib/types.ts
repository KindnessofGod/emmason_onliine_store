import type { Locale } from "./i18n/config";

/** A string that exists in every supported language. */
export type LocalizedText = Record<Locale, string>;

export type Condition = "new" | "uk-used" | "refurbished";

export type FulfilmentMethod = "pickup" | "delivery";

export type PaymentMethod = "on-delivery" | "transfer" | "card";

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  tagline: LocalizedText;
  /** Emoji used as the category glyph — keeps the build asset-free. */
  glyph: string;
  /** Two brand-family hex stops used for the category tile and image placeholders. */
  gradient: [string, string];
}

export interface Seller {
  id: string;
  slug: string;
  name: string;
  /** Short public blurb shown on the seller page. */
  bio: LocalizedText;
  city: string;
  state: string;
  since: number;
  verified: boolean;
  /** Emmason itself, as opposed to a third-party marketplace seller. */
  isHouse: boolean;
  rating: number;
  reviewCount: number;
}

export interface Product {
  id: string;
  slug: string;
  /** Brand/model names are not translated — "Nokia 150 4G" reads the same everywhere. */
  name: string;
  brand: string;
  categorySlug: string;
  sellerId: string;
  /** Denormalised from the seller row so product cards need no second lookup. */
  sellerSlug: string;
  sellerName: string;
  /** Price in whole Naira. */
  price: number;
  /** Original price in whole Naira, when the item is discounted. */
  compareAtPrice?: number;
  condition: Condition;
  stock: number;
  warrantyMonths: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  /** ISO date — drives the "new arrivals" ordering. */
  addedAt: string;
  description: LocalizedText;
  /** Spec rows. Labels are localized; values (e.g. "6.7 inch") are not. */
  specs: Array<{ label: LocalizedText; value: string }>;
  /** Public photo URLs in display order. Empty until real photography is uploaded. */
  images: string[];
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface OrderDraft {
  fullName: string;
  phone: string;
  email: string;
  fulfilment: FulfilmentMethod;
  street: string;
  city: string;
  state: string;
  landmark: string;
  payment: PaymentMethod;
  notes: string;
}

export interface SellerApplication {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  nin: string;
  categories: string[];
  about: string;
  acceptedTerms: boolean;
}
