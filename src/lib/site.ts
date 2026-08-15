/** Business details that appear across the site and in structured data. */
export const site = {
  name: "Emmason",
  legalName: "Emmason Mobile Phones, Tech & Gadgets",
  phones: ["0906 5755 314", "0803 863 0197"],
  email: "hello@emmasongadgets.com",
  address: {
    line1: "No 24 Day Star Plaza",
    line2: "Opposite St. Peter's Anglican Church",
    city: "Owerri",
    state: "Imo",
    country: "Nigeria",
  },
  socials: {
    tiktok: { handle: "emmasongadgets", url: "https://www.tiktok.com/@emmasongadgets" },
    facebook: {
      handle: "emmason Mobile Phones Tech & Gadgets",
      url: "https://www.facebook.com/emmasongadgets",
    },
    instagram: { handle: "emmasongadgets", url: "https://www.instagram.com/emmasongadgets" },
  },
  /** Flat delivery fee in Naira. Pickup is free. */
  deliveryFee: 3500,
  /** Orders at or above this subtotal ship free. */
  freeDeliveryThreshold: 150000,
} as const;

export function whatsappLink(message?: string): string {
  const number = "2349065755314";
  return message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`;
}
