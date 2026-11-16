import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Supabase client bound to the current request's auth cookies.
 * Use this for everything the signed-in Admin does — RLS is enforced.
 * Anonymous visitors get an anon-key client that can only read public products.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies are read-only.
          // The proxy (proxy.ts) refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client. BYPASSES Row Level Security.
 *
 * Only used on the server for:
 *  - inserting visitor submissions / requests after validation + rate limiting
 *  - uploading visitor images to storage
 *  - rate-limit bookkeeping
 *
 * Never expose the service role key to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
