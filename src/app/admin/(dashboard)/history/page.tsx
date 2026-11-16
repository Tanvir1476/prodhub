import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, History, PencilRuler, ScrollText, Trash2 } from "lucide-react";

import { ActionLabel } from "@/components/admin/action-label";
import { AdminParamSelect, AdminSearch } from "@/components/admin/admin-search";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FIELD_LABELS } from "@/lib/constants";
import { listActivityLogs, listChangeRequests, listDeletionRequests, listSubmissions } from "@/lib/queries";
import type { ReviewStatus } from "@/lib/types";
import { formatDate, shortId, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Request History" };

interface HistoryRow {
  id: string;
  kind: "submission" | "change_request" | "deletion_request";
  title: string;
  summary: string;
  status: ReviewStatus;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  href: string;
}

const KIND_META = {
  submission: { label: "Submission", Icon: ClipboardList, variant: "info" as const },
  change_request: { label: "Change request", Icon: PencilRuler, variant: "violet" as const },
  deletion_request: { label: "Deletion request", Icon: Trash2, variant: "destructive" as const },
};

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; kind?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const status = (["approved", "rejected", "all"].includes(sp.status ?? "") ? sp.status : "all") as ReviewStatus | "all";
  const kind = (["submission", "change_request", "deletion_request", "all"].includes(sp.kind ?? "") ? sp.kind : "all") as HistoryRow["kind"] | "all";

  const [subs, changes, deletions, logs] = await Promise.all([
    listSubmissions("all"),
    listChangeRequests("all"),
    listDeletionRequests("all"),
    listActivityLogs(sp.q),
  ]);

  let rows: HistoryRow[] = [
    ...subs
      .filter((s) => s.status !== "pending")
      .map<HistoryRow>((s) => ({
        id: s.id,
        kind: "submission",
        title: s.name,
        summary: s.status === "approved" ? "Published to the catalogue" : "Not published",
        status: s.status,
        created_at: s.created_at,
        reviewed_at: s.reviewed_at,
        admin_note: s.admin_note,
        href: `/admin/submissions/${s.id}`,
      })),
    ...changes
      .filter((r) => r.status !== "pending")
      .map<HistoryRow>((r) => ({
        id: r.id,
        kind: "change_request",
        title: r.products?.name ?? "Deleted product",
        summary: Object.keys(r.requested_changes ?? {})
          .map((f) => FIELD_LABELS[f] ?? f)
          .join(", "),
        status: r.status,
        created_at: r.created_at,
        reviewed_at: r.reviewed_at,
        admin_note: r.admin_note,
        href: `/admin/change-requests/${r.id}`,
      })),
    ...deletions
      .filter((r) => r.status !== "pending")
      .map<HistoryRow>((r) => ({
        id: r.id,
        kind: "deletion_request",
        title: r.products?.name ?? "Deleted product",
        summary: truncate(r.reason, 80),
        status: r.status,
        created_at: r.created_at,
        reviewed_at: r.reviewed_at,
        admin_note: r.admin_note,
        href: `/admin/deletion-requests?status=${r.status}&q=${encodeURIComponent(r.products?.name ?? "")}`,
      })),
  ];

  if (status !== "all") rows = rows.filter((r) => r.status === status);
  if (kind !== "all") rows = rows.filter((r) => r.kind === kind);
  if (sp.q) {
    const needle = sp.q.toLowerCase();
    rows = rows.filter(
      (r) => r.title.toLowerCase().includes(needle) || r.summary.toLowerCase().includes(needle) || r.id.toLowerCase().startsWith(needle)
    );
  }
  rows.sort((a, b) => new Date(b.reviewed_at ?? b.created_at).getTime() - new Date(a.reviewed_at ?? a.created_at).getTime());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Request History"
        description="Every reviewed submission and request, plus a full audit trail of administrative actions."
      />

      <Tabs defaultValue={sp.tab === "activity" ? "activity" : "requests"}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="requests">
              <History className="size-4" /> Reviewed requests
            </TabsTrigger>
            <TabsTrigger value="activity">
              <ScrollText className="size-4" /> Activity log
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-col gap-3 sm:flex-row">
            <AdminSearch placeholder="Search records…" className="sm:w-64" />
            <AdminParamSelect
              param="status"
              value={status}
              placeholder="Status"
              options={[
                { value: "all", label: "Approved & rejected" },
                { value: "approved", label: "Approved only" },
                { value: "rejected", label: "Rejected only" },
              ]}
            />
            <AdminParamSelect
              param="kind"
              value={kind}
              placeholder="Type"
              options={[
                { value: "all", label: "All types" },
                { value: "submission", label: "Submissions" },
                { value: "change_request", label: "Change requests" },
                { value: "deletion_request", label: "Deletion requests" },
              ]}
            />
          </div>
        </div>

        <TabsContent value="requests">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {rows.length === 0 ? (
              <EmptyState text="No reviewed requests match these filters." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="min-w-[240px]">Record</TableHead>
                    <TableHead className="hidden md:table-cell">Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                    <TableHead className="hidden lg:table-cell">Reviewed</TableHead>
                    <TableHead className="hidden xl:table-cell">Admin note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const meta = KIND_META[r.kind];
                    return (
                      <TableRow key={`${r.kind}-${r.id}`}>
                        <TableCell>
                          <Badge variant={meta.variant}>
                            <meta.Icon /> {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={r.href} className="line-clamp-1 font-semibold hover:text-primary">
                            {r.title}
                          </Link>
                          <p className="font-mono text-xs text-muted-foreground">#{shortId(r.id)}</p>
                        </TableCell>
                        <TableCell className="hidden max-w-[260px] text-sm text-muted-foreground md:table-cell">{r.summary}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(r.created_at)}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(r.reviewed_at, true)}</TableCell>
                        <TableCell className="hidden max-w-[220px] text-sm text-muted-foreground xl:table-cell">{r.admin_note ? truncate(r.admin_note, 80) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {logs.length === 0 ? (
              <EmptyState text="No administrative actions recorded yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead className="min-w-[320px]">Action</TableHead>
                    <TableHead className="hidden md:table-cell">Target</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const d = log.details ?? {};
                    const name = String(d.product_name ?? d.name ?? "");
                    const note = d.note ? String(d.note) : null;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.created_at, true)}</TableCell>
                        <TableCell className="text-sm">
                          <ActionLabel action={log.action} /> {name && <span className="font-semibold">{name}</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {log.target_type}
                            {log.target_id ? ` · ${shortId(log.target_id)}` : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden max-w-[320px] text-xs text-muted-foreground lg:table-cell">
                          {note ? `Note: ${truncate(note, 100)}` : d.applied ? `Applied: ${Object.keys(d.applied as object).map((f) => FIELD_LABELS[f] ?? f).join(", ")}` : d.permanent ? "Permanent delete" : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <History className="size-7" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
