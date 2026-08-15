import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { storeConfig } from "@/lib/store-config";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(storeConfig.siteUrl),
  title: {
    default: `${storeConfig.name} — Gadgets & Home Essentials in Nigeria`,
    template: `%s | ${storeConfig.name}`,
  },
  description: storeConfig.tagline,
  openGraph: {
    title: storeConfig.name,
    description: storeConfig.tagline,
    type: "website",
    locale: "en_NG",
  },
};

/**
 * Root shell only. The storefront chrome lives in the (store) group and the
 * admin chrome in admin/(dashboard), so neither leaks into the other.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
