import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { storeConfig } from "@/lib/store-config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-bold tracking-tight">
            {storeConfig.name} <span className="text-ink-500">admin</span>
          </Link>

          <nav className="flex gap-1 text-sm">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 transition hover:bg-brand-50"
            >
              Overview
            </Link>
            <Link
              href="/admin/orders"
              className="rounded-lg px-3 py-1.5 transition hover:bg-brand-50"
            >
              Orders
            </Link>
            <Link
              href="/admin/products"
              className="rounded-lg px-3 py-1.5 transition hover:bg-brand-50"
            >
              Products
            </Link>
            <Link
              href="/admin/products/capture"
              className="rounded-lg px-3 py-1.5 transition hover:bg-brand-50"
            >
              Capture
            </Link>
            <Link
              href="/admin/wholesale-leads"
              className="rounded-lg px-3 py-1.5 transition hover:bg-brand-50"
            >
              Wholesale leads
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/" className="text-ink-500 hover:text-brand-600">
              View store →
            </Link>
            <span className="hidden text-ink-500 sm:inline">{admin.email}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
