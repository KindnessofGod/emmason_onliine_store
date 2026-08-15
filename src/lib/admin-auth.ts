import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Resolve the signed-in admin, or null. Middleware already blocks anonymous
 * visitors; this is the check that the signed-in user is actually on the admin
 * roster, which middleware cannot do without a database round trip.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Read the roster with the service role: a non-admin's own RLS view of the
  // admins table is empty, which would be indistinguishable from "not found".
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admins")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return { id: user.id, email: data.email ?? user.email ?? "" };
}

/** Use at the top of every admin page. Redirects rather than returning null. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login?error=forbidden");
  return admin;
}
