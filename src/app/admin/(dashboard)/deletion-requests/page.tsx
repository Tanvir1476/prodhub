import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusTabs } from "@/components/admin/status-tabs";
import { ProductImage } from "@/components/product/product-image";
import { AvailabilityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats, listDeletionRequests } from "@/lib/queries";
import type { ReviewStatus } from "@/lib/types";
import { formatBDT, formatDate, shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Deletion Requests" };

export default async function AdminDeletionRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = (["pending", "approved", "rejected", "all"].includes(sp.status ?? "") ? sp.status : "pending") as ReviewStatus | "all";
  const [rows, stats] = await Promise.all([listDeletionRequests(status, sp.q), getAdminDashboardStats()]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deletion Requests"
        description="Products visitors believe should be removed. Approving archives the product — it is hidden, not destroyed."
      />

      <StatusTabs value={status} counts={{ pending: stats.pendingDeletions }} searchPlaceholder="Search by product or request ID…" />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-soft">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trash2 className="size-7" />
          </span>
          <h3 className="mt-4 font-semibold">No {status === "all" ? "" : status} deletion requests</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {status === "pending" ? "Nothing to review right now." : "Nothing to show for this filter."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    <ProductImage src={r.products?.image_url} alt={r.products?.name ?? ""} sizes="56px" />
                  </div>
                  <div className="min-w-0">
                    {r.products ? (
                      <Link href={`/admin/products/${r.products.id}`} className="line-clamp-1 font-semibold hover:text-primary">
                        {r.products.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-muted-foreground">Product removed</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Request #{shortId(r.id)} · {formatDate(r.created_at, true)}
                      {r.submitter_name && ` · by ${r.submitter_name}`}
                    </p>
                    {r.products && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-primary">{formatBDT(r.products.price)}</span>
                        <AvailabilityBadge quantity={r.products.quantity} />
                        {r.products.is_archived && <StatusBadge status="archived" />}
                      </div>
                    )}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Reason for removal</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{r.reason}</p>
                {r.additional_info && (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional information</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.additional_info}</p>
                  </>
                )}
              </div>

              {r.status !== "pending" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Reviewed {formatDate(r.reviewed_at, true)}
                  {r.admin_note && (
                    <>
                      {" "}
                      · Note: <span className="text-foreground">{r.admin_note}</span>
                    </>
                  )}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                {r.products && !r.products.is_archived ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products/${r.products.id}`} target="_blank">
                      <ExternalLink /> Public page
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {r.status === "pending" && r.products && <ReviewActions kind="deletion_request" id={r.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
