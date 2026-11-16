import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { ColorSwatches } from "@/components/product/color-swatches";
import { ProductImage } from "@/components/product/product-image";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubmission } from "@/lib/queries";
import { formatBDT, formatDate, shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Submission details" };

export default async function AdminSubmissionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSubmission(id);
  if (!s) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to submissions
      </Link>

      <AdminPageHeader
        title={s.name}
        description={`Submission #${shortId(s.id)} · received ${formatDate(s.created_at, true)}`}
        actions={
          s.status === "pending" ? (
            <ReviewActions kind="submission" id={s.id} size="default" />
          ) : (
            <StatusBadge status={s.status} />
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-slate-50">
            <ProductImage src={s.image_url} alt={s.name} fit="contain" sizes="360px" className="p-4" placeholderIcon="image" />
          </div>
          {s.image_url && (
            <CardContent className="p-3">
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <a href={s.image_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink /> Open full-size image
                </a>
              </Button>
            </CardContent>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Row label="Price">
                  <span className="text-lg font-bold text-primary">{formatBDT(s.price)}</span>
                </Row>
                <Row label="Quantity">{s.quantity}</Row>
                <Row label="Category">{s.category ?? "—"}</Row>
                <Row label="Colors">
                  <ColorSwatches colors={s.colors} max={12} showLabels />
                </Row>
                <Row label="Purchase link" className="sm:col-span-2">
                  {s.purchase_link ? (
                    <a href={s.purchase_link} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-primary hover:underline">
                      {s.purchase_link}
                    </a>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Description" className="sm:col-span-2">
                  <p className="whitespace-pre-line text-slate-700">{s.description ?? "—"}</p>
                </Row>
                <Row label="Submitted by">{s.submitter_name ?? "Anonymous"}</Row>
                <Row label="Status">
                  <StatusBadge status={s.status} />
                </Row>
              </dl>
            </CardContent>
          </Card>

          {s.status !== "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Review outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Row label="Reviewed on">{formatDate(s.reviewed_at, true)}</Row>
                  {s.published_product_id && (
                    <Row label="Published product">
                      <Link href={`/admin/products/${s.published_product_id}`} className="text-primary hover:underline">
                        Open product →
                      </Link>
                    </Row>
                  )}
                  <Row label="Admin note" className="sm:col-span-2">
                    {s.admin_note ?? <span className="text-muted-foreground">No note</span>}
                  </Row>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
