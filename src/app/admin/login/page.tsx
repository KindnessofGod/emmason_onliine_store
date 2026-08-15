import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center px-4 py-20">
      <h1 className="text-2xl font-bold tracking-tight">Staff sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This area is for store staff. Customers do not need an account.
      </p>

      {error === "forbidden" && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          That account is signed in but is not a store admin.
        </p>
      )}

      <LoginForm nextPath={next ?? "/admin"} />
    </div>
  );
}
