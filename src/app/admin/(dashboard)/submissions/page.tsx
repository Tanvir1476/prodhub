import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Eye } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusTabs } from "@/components/admin/status-tabs";
import { ColorSwatches } from "@/components/product/color-swatches";
import { ProductImage } from "@/components/product/product-image";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminDashboardStats, listSubmissions } from "@/lib/queries";
import type { ReviewStatus } from "@/lib/types";
import { formatBDT, formatDate, shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Product Submissions" };

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = (["pending", "approved", "rejected", "all"].includes(sp.status ?? "") ? sp.status : "pending") as ReviewStatus | "all";
  const [rows, stats] = await Promise.all([listSubmissions(status, sp.q), getAdminDashboardStats()]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Product Submissions" description="New products proposed by visitors. Approve to publish them to the catalogue." />

      <StatusTabs value={status} counts={{ pending: stats.pendingSubmissions }} searchPlaceholder="Search by product name…" />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {rows.length === 0 ? (
          <Empty status={status} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Submitted product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="hidden md:table-cell">Colors</TableHead>
                <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                        <ProductImage src={s.image_url} alt={s.name} sizes="48px" placeholderIcon="image" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/submissions/${s.id}`} className="line-clamp-1 font-semibold hover:text-primary">
                          {s.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          #{shortId(s.id)} · {s.category ?? "No category"}
                          {s.submitter_name && ` · by ${s.submitter_name}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{formatBDT(s.price)}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ColorSwatches colors={s.colors} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(s.created_at, true)}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/submissions/${s.id}`}>
                          <Eye /> <span className="hidden sm:inline">View Details</span>
                        </Link>
                      </Button>
                      {s.status === "pending" && <ReviewActions kind="submission" id={s.id} compact />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function Empty({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ClipboardList className="size-7" />
      </span>
      <h3 className="mt-4 font-semibold">No {status === "all" ? "" : status} submissions</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {status === "pending" ? "You're all caught up. New visitor submissions will appear here." : "Nothing to show for this filter."}
      </p>
    </div>
  );
}
