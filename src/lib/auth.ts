import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

export interface AdminSession {
  userId: string;
  email: string;
}

/**
 * Returns the current Admin session or null.
 * Two independent checks must pass:
 *   1. a valid Supabase Auth user exists for this request
 *   2. the user is registered in public.admin_users (checked through RLS)
 *      AND its email matches ADMIN_EMAIL (defence in depth)
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  if (user.email.toLowerCase() !== serverEnv.adminEmail) return null;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return null;

  return { userId: user.id, email: user.email };
});

/** Use in server components: redirects to the login page when not authenticated. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?reason=unauthorized");
  return session;
}

/** Use in server actions: throws when not authenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("You must be signed in as the Admin to perform this action.");
  return session;
}
