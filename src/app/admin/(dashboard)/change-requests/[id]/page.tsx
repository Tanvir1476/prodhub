import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Paperclip } from "lucide-react";

import { ChangeDiff } from "@/components/admin/change-diff";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { ProductImage } from "@/components/product/product-image";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChangeRequest } from "@/lib/queries";
import { formatDate, shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Change request" };

export default async function AdminChangeRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getChangeRequest(id);
  if (!r) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/change-requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to change requests
      </Link>

      <AdminPageHeader
        title={`Change request #${shortId(r.id)}`}
        description={`Submitted ${formatDate(r.created_at, true)}${r.submitter_name ? ` by ${r.submitter_name}` : " anonymously"}`}
        actions={
          r.status === "pending" && r.products ? <ReviewActions kind="change_request" id={r.id} size="default" /> : <StatusBadge status={r.status} />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requested changes</CardTitle>
              <CardDescription>Approving applies all proposed values below to the product in one transaction.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeDiff changes={r.requested_changes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-slate-700">{r.reason}</p>
              {r.evidence_url && (
                <div className="mt-5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Paperclip className="size-3.5" /> Supporting evidence
                  </p>
                  <a href={r.evidence_url} target="_blank" rel="noopener noreferrer" className="relative mt-2 block h-64 w-full overflow-hidden rounded-xl border border-border bg-slate-50">
                    <Image src={r.evidence_url} alt="Supporting evidence" fill sizes="640px" className="object-contain" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {r.status !== "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Review outcome</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Decision:</span> <StatusBadge status={r.status} className="ml-1" />
                </p>
                <p>
                  <span className="text-muted-foreground">Reviewed on:</span> {formatDate(r.reviewed_at, true)}
                </p>
                <p>
                  <span className="text-muted-foreground">Admin note:</span> {r.admin_note ?? "—"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Affected product</CardTitle>
            </CardHeader>
            <CardContent>
              {r.products ? (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-50">
                    <ProductImage src={r.products.image_url} alt={r.products.name} sizes="320px" />
                  </div>
                  <p className="mt-3 font-semibold">{r.products.name}</p>
                  {r.products.is_archived && <StatusBadge status="archived" className="mt-2" />}
                  <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${r.products.id}`}>Open in admin</Link>
                    </Button>
                    {!r.products.is_archived && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/products/${r.products.id}`} target="_blank">
                          <ExternalLink /> View public page
                        </Link>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">The product this request referred to has been deleted.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
