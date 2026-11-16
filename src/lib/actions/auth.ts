"use server";

import { z } from "zod";

import { serverEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

/**
 * Admin login. Credentials are checked by Supabase Auth; the email must also
 * match ADMIN_EMAIL and the user must be registered in admin_users.
 */
export async function signInAdmin(formData: FormData): Promise<ActionResult<{ next: string }>> {
  const rl = await checkRateLimit({ scope: "admin-login", limit: 8, windowSeconds: 15 * 60 });
  if (!rl.ok) return { ok: false, error: rl.error };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { email, password } = parsed.data;

  // Generic error on purpose: never reveal whether the email is the admin's.
  const invalid = { ok: false as const, error: "Invalid email or password." };

  if (email.trim().toLowerCase() !== serverEnv.adminEmail) return invalid;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return invalid;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This account is not registered as the Admin. Run supabase/admin.sql to register it.",
    };
  }

  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  return { ok: true, data: { next: safeNext } };
}
