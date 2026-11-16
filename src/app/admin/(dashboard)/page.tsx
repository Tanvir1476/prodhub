import Link from "next/link";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  PencilRuler,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

import { ActionLabel } from "@/components/admin/action-label";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_LABELS } from "@/lib/constants";
import {
  getAdminDashboardStats,
  listActivityLogs,
  listChangeRequests,
  listDeletionRequests,
  listSubmissions,
} from "@/lib/queries";
import { cn, formatBDT, shortId, timeAgo } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [stats, submissions, changes, deletions, logs] = await Promise.all([
    getAdminDashboardStats(),
    listSubmissions("pending"),
    listChangeRequests("pending"),
    listDeletionRequests("pending"),
    listActivityLogs(undefined, 8),
  ]);

  const cards = [
    { label: "Total Products", value: stats.totalProducts, Icon: Package, href: "/admin/products", tone: "bg-indigo-50 text-primary" },
    { label: "Pending Submissions", value: stats.pendingSubmissions, Icon: ClipboardList, href: "/admin/submissions", tone: "bg-amber-50 text-amber-600" },
    { label: "Pending Change Requests", value: stats.pendingChanges, Icon: PencilRuler, href: "/admin/change-requests", tone: "bg-violet-50 text-violet-600" },
    { label: "Pending Deletion Requests", value: stats.pendingDeletions, Icon: Trash2, href: "/admin/deletion-requests", tone: "bg-red-50 text-red-600" },
    { label: "Approved Requests", value: stats.approvedRequests, Icon: CheckCircle2, href: "/admin/history?status=approved", tone: "bg-emerald-50 text-emerald-600" },
    { label: "Rejected Requests", value: stats.rejectedRequests, Icon: XCircle, href: "/admin/history?status=rejected", tone: "bg-slate-100 text-slate-600" },
  ];

  const totalPending = stats.pendingSubmissions + stats.pendingChanges + stats.pendingDeletions;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description={
          totalPending > 0
            ? `${totalPending} item${totalPending === 1 ? "" : "s"} waiting for your review.`
            : "Everything is reviewed. Nice work."
        }
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> Add Product
            </Link>
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {cards.map(({ label, value, Icon, href, tone }) => (
          <Link key={label} href={href} className="group rounded-2xl border border-border bg-card p-5 shadow-soft card-hover">
            <div className="flex items-center justify-between">
              <span className={cn("flex size-11 items-center justify-center rounded-xl", tone)}>
                <Icon className="size-5" />
              </span>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{value.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {stats.archivedProducts > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Archive className="size-4" /> {stats.archivedProducts} archived product{stats.archivedProducts === 1 ? "" : "s"} hidden from visitors.{" "}
          <Link href="/admin/products?view=archived" className="font-medium text-primary hover:underline">
            Manage archive
          </Link>
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Review queue */}
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Product Submissions</CardTitle>
                <CardDescription>New products proposed by visitors.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/submissions">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <EmptyQueue text="No pending submissions." />
              ) : (
                <ul className="divide-y divide-border">
                  {submissions.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex items-center gap-4 py-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                        <ProductImage src={s.image_url} alt={s.name} sizes="48px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/submissions/${s.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                          {s.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatBDT(s.price)} · Qty {s.quantity} · {timeAgo(s.created_at)}
                          {s.submitter_name && ` · by ${s.submitter_name}`}
                        </p>
                      </div>
                      <ReviewActions kind="submission" id={s.id} compact />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Change Requests</CardTitle>
                <CardDescription>Proposed corrections to existing products.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/change-requests">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {changes.length === 0 ? (
                <EmptyQueue text="No pending change requests." />
              ) : (
                <ul className="divide-y divide-border">
                  {changes.slice(0, 5).map((r) => {
                    const fields = Object.keys(r.requested_changes ?? {});
                    return (
                      <li key={r.id} className="flex items-center gap-4 py-3">
                        <div className="min-w-0 flex-1">
                          <Link href={`/admin/change-requests/${r.id}`} className="block truncate text-sm font-semibold hover:text-primary">
                            {r.products?.name ?? "Unknown product"}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            #{shortId(r.id)} · {fields.map((f) => FIELD_LABELS[f] ?? f).join(", ")} · {timeAgo(r.created_at)}
                          </p>
                        </div>
                        <ReviewActions kind="change_request" id={r.id} compact />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Deletion Requests</CardTitle>
                <CardDescription>Products visitors think should be removed.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/deletion-requests">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {deletions.length === 0 ? (
                <EmptyQueue text="No pending deletion requests." />
              ) : (
                <ul className="divide-y divide-border">
                  {deletions.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/deletion-requests?status=pending&q=${encodeURIComponent(r.products?.name ?? "")}`} className="block truncate text-sm font-semibold hover:text-primary">
                          {r.products?.name ?? "Unknown product"}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          #{shortId(r.id)} · {r.reason} · {timeAgo(r.created_at)}
                        </p>
                      </div>
                      <ReviewActions kind="deletion_request" id={r.id} compact />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="self-start">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest administrative actions.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/history">
                All <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <EmptyQueue text="No activity yet." />
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-4">
                {logs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white bg-primary" />
                    <p className="text-sm">
                      <ActionLabel action={log.action} />{" "}
                      <span className="font-medium">{String(log.details?.product_name ?? log.details?.name ?? "")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyQueue({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-slate-50/60 px-4 py-6 text-sm text-muted-foreground">
      <CheckCircle2 className="size-4 text-emerald-500" /> {text}
    </div>
  );
}
