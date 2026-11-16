import "server-only";

import { cache } from "react";

import { PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminActivityLog,
  ChangeRequest,
  DeletionRequest,
  Product,
  ProductSubmission,
  PublicStats,
  ReviewStatus,
} from "@/lib/types";

/* ------------------------------ public ---------------------------------- */

export interface ProductFilters {
  q?: string;
  category?: string;
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc" | "price_asc" | "price_desc";
  inStock?: boolean;
  page?: number;
  pageSize?: number;
  /** active (default): hide archived · archived: only archived · all: everything */
  archived?: "active" | "archived" | "all";
}

export async function listProducts(filters: ProductFilters = {}) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("products").select("*", { count: "exact" });

  const archived = filters.archived ?? "active";
  if (archived === "active") query = query.eq("is_archived", false);
  else if (archived === "archived") query = query.eq("is_archived", true);
  if (filters.q) query = query.ilike("name", `%${escapeLike(filters.q)}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.colors && filters.colors.length > 0) query = query.overlaps("colors", filters.colors);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.inStock) query = query.gt("quantity", 0);

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    products: (data ?? []) as Product[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) ?? null;
});

export async function getRecentProducts(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Product[];
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").eq("is_archived", false).neq("id", product.id).limit(limit);
  if (product.category) query = query.eq("category", product.category);
  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as Product[];
}

export async function getPublicStats(): Promise<PublicStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_stats").maybeSingle();
  const row = (data ?? {}) as Partial<PublicStats>;
  return {
    total_products: Number(row.total_products ?? 0),
    available_products: Number(row.available_products ?? 0),
    community_contributions: Number(row.community_contributions ?? 0),
  };
}

/** Distinct categories / colors / price bounds currently in the catalogue (for filters). */
export async function getFilterFacets() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category, colors, price").eq("is_archived", false);
  const rows = (data ?? []) as Pick<Product, "category" | "colors" | "price">[];

  const categories = new Map<string, number>();
  const colors = new Map<string, number>();
  let maxPrice = 0;
  for (const r of rows) {
    if (r.category) categories.set(r.category, (categories.get(r.category) ?? 0) + 1);
    for (const c of r.colors ?? []) {
      const key = c.trim();
      if (key) colors.set(key, (colors.get(key) ?? 0) + 1);
    }
    maxPrice = Math.max(maxPrice, Number(r.price));
  }
  return {
    categories: [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count })),
    colors: [...colors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([name, count]) => ({ name, count })),
    maxPrice,
  };
}

/* ------------------------------- admin ----------------------------------- */

export async function getAdminDashboardStats() {
  const supabase = await createClient();
  const count = async (table: string, status?: ReviewStatus, extra?: Record<string, unknown>) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    for (const [k, v] of Object.entries(extra ?? {})) q = q.eq(k, v as string);
    const { count } = await q;
    return count ?? 0;
  };

  const [
    totalProducts,
    archivedProducts,
    pendingSubmissions,
    pendingChanges,
    pendingDeletions,
    approvedSubmissions,
    approvedChanges,
    approvedDeletions,
    rejectedSubmissions,
    rejectedChanges,
    rejectedDeletions,
  ] = await Promise.all([
    count("products", undefined, { is_archived: false }),
    count("products", undefined, { is_archived: true }),
    count("product_submissions", "pending"),
    count("change_requests", "pending"),
    count("deletion_requests", "pending"),
    count("product_submissions", "approved"),
    count("change_requests", "approved"),
    count("deletion_requests", "approved"),
    count("product_submissions", "rejected"),
    count("change_requests", "rejected"),
    count("deletion_requests", "rejected"),
  ]);

  return {
    totalProducts,
    archivedProducts,
    pendingSubmissions,
    pendingChanges,
    pendingDeletions,
    approvedRequests: approvedSubmissions + approvedChanges + approvedDeletions,
    rejectedRequests: rejectedSubmissions + rejectedChanges + rejectedDeletions,
  };
}

export async function listSubmissions(status?: ReviewStatus | "all", q?: string) {
  const supabase = await createClient();
  let query = supabase.from("product_submissions").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${escapeLike(q)}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductSubmission[];
}

export async function getSubmission(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("product_submissions").select("*").eq("id", id).maybeSingle();
  return (data as ProductSubmission) ?? null;
}

export async function listChangeRequests(status?: ReviewStatus | "all", q?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("change_requests")
    .select("*, products(id, name, image_url, is_archived)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as ChangeRequest[];
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) => r.products?.name?.toLowerCase().includes(needle) || r.id.toLowerCase().startsWith(needle)
    );
  }
  return rows;
}

export async function getChangeRequest(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_requests")
    .select("*, products(id, name, image_url, is_archived)")
    .eq("id", id)
    .maybeSingle();
  return (data as ChangeRequest) ?? null;
}

export async function listDeletionRequests(status?: ReviewStatus | "all", q?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("deletion_requests")
    .select("*, products(id, name, image_url, price, quantity, is_archived)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as DeletionRequest[];
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) => r.products?.name?.toLowerCase().includes(needle) || r.id.toLowerCase().startsWith(needle)
    );
  }
  return rows;
}

export async function listActivityLogs(q?: string, limit = 300) {
  const supabase = await createClient();
  let query = supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (q) query = query.or(`action.ilike.%${escapeLike(q)}%,target_type.ilike.%${escapeLike(q)}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminActivityLog[];
}

/** Pending requests that reference a product (shown on the admin product page). */
export async function getPendingRequestsForProduct(productId: string) {
  const supabase = await createClient();
  const [changes, deletions] = await Promise.all([
    supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("status", "pending"),
    supabase.from("deletion_requests").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("status", "pending"),
  ]);
  return { changes: changes.count ?? 0, deletions: deletions.count ?? 0 };
}

/* ------------------------------- utils ----------------------------------- */

export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function escapeLike(v: string) {
  return v.replace(/[%_\\]/g, (m) => `\\${m}`).slice(0, 100);
}
