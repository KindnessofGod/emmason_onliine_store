import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Emmason admin",
  robots: { index: false, follow: false },
};

/**
 * Second root layout, for the staff area.
 *
 * The shop's root layout lives at (shop)/[locale]/layout.tsx so that <html lang>
 * can follow the locale. Admin is not locale-prefixed, so it needs its own root
 * layout — Next's documented multiple-root-layouts pattern. There is
 * deliberately no src/app/layout.tsx; adding one would nest two <html> tags.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-ink-900 antialiased">{children}</body>
    </html>
  );
}
