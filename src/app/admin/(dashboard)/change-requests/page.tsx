import type { Metadata } from "next";
import Link from "next/link";
import { Eye, PencilRuler } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusTabs } from "@/components/admin/status-tabs";
import { ProductImage } from "@/components/product/product-image";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FIELD_LABELS } from "@/lib/constants";
import { getAdminDashboardStats, listChangeRequests } from "@/lib/queries";
import type { ReviewStatus } from "@/lib/types";
import { formatBDT, formatDate, shortId, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Change Requests" };

export default async function AdminChangeRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = (["pending", "approved", "rejected", "all"].includes(sp.status ?? "") ? sp.status : "pending") as ReviewStatus | "all";
  const [rows, stats] = await Promise.all([listChangeRequests(status, sp.q), getAdminDashboardStats()]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Change Requests" description="Corrections proposed by visitors. Approving applies every proposed value to the product." />

      <StatusTabs value={status} counts={{ pending: stats.pendingChanges }} searchPlaceholder="Search by product or request ID…" />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <PencilRuler className="size-7" />
            </span>
            <h3 className="mt-4 font-semibold">No {status === "all" ? "" : status} change requests</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {status === "pending" ? "Nothing to review right now." : "Nothing to show for this filter."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead className="min-w-[220px]">Product</TableHead>
                <TableHead className="min-w-[260px]">Requested changes</TableHead>
                <TableHead className="hidden xl:table-cell">Reason</TableHead>
                <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const entries = Object.entries(r.requested_changes ?? {});
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">#{shortId(r.id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                          <ProductImage src={r.products?.image_url} alt={r.products?.name ?? ""} sizes="40px" />
                        </div>
                        <div className="min-w-0">
                          {r.products ? (
                            <Link href={`/admin/products/${r.products.id}`} className="line-clamp-1 font-semibold hover:text-primary">
                              {r.products.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Product removed</span>
                          )}
                          {r.products?.is_archived && <StatusBadge status="archived" className="mt-1" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-1">
                        {entries.slice(0, 3).map(([field, c]) => (
                          <li key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
                            <Badge variant="violet">{FIELD_LABELS[field] ?? field}</Badge>
                            <span className="text-muted-foreground line-through">{short(field, c?.current)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-emerald-700">{short(field, c?.proposed)}</span>
                          </li>
                        ))}
                        {entries.length > 3 && <li className="text-xs text-muted-foreground">+{entries.length - 3} more</li>}
                      </ul>
                    </TableCell>
                    <TableCell className="hidden max-w-[240px] text-sm text-muted-foreground xl:table-cell">{truncate(r.reason, 90)}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(r.created_at, true)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/change-requests/${r.id}`}>
                            <Eye /> <span className="hidden sm:inline">View Details</span>
                          </Link>
                        </Button>
                        {r.status === "pending" && r.products && <ReviewActions kind="change_request" id={r.id} compact />}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function short(field: string, value?: string) {
  if (!value) return "—";
  if (field === "image_url") return "image";
  if (field === "price") return formatBDT(value);
  return truncate(value, 28);
}
