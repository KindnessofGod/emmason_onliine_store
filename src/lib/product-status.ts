import type { ProductStatus } from "@/lib/db-types";

/** Single source of truth for how each Product Status is labelled in the admin UI. */
export const PRODUCT_STATUSES: {
  value: ProductStatus;
  label: string;
  description: string;
}[] = [
  { value: "published", label: "Published", description: "live on the storefront" },
  { value: "unpublished", label: "Unpublished", description: "hidden, was live before" },
  { value: "pending_review", label: "Pending review", description: "not yet approved" },
];
