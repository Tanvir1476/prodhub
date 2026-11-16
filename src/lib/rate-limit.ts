import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { serverEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

interface RateLimitOptions {
  /** Logical name of the endpoint, e.g. "submission" */
  scope: string;
  /** Max events allowed within the window */
  limit: number;
  /** Window length in seconds */
  windowSeconds: number;
}

/**
 * Database-backed sliding-window rate limiter keyed by a salted hash of the
 * client IP. Works across serverless instances (unlike an in-memory Map).
 * The raw IP address is never stored.
 */
export async function checkRateLimit(opts: RateLimitOptions): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const bucket = `${opts.scope}:${createHash("sha256").update(serverEnv.rateLimitSalt + ip).digest("hex").slice(0, 32)}`;
  const since = new Date(Date.now() - opts.windowSeconds * 1000).toISOString();

  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);

  if (error) {
    // Fail open on infrastructure errors (but log) so legitimate users aren't blocked.
    console.error("[rate-limit] lookup failed", error.message);
    return { ok: true };
  }

  if ((count ?? 0) >= opts.limit) {
    const minutes = Math.ceil(opts.windowSeconds / 60);
    return {
      ok: false,
      error: `You have reached the limit for this action. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  await supabase.from("rate_limit_events").insert({ bucket });

  // Opportunistic clean-up of stale rows (1 in 20 requests).
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("rate_limit_events").delete().lt("created_at", cutoff);
  }

  return { ok: true };
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown"
  );
}
