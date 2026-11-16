import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, PencilRuler, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { ColorSwatches } from "@/components/product/color-swatches";
import { ProductImage } from "@/components/product/product-image";
import { AvailabilityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingRequestsForProduct, getProduct } from "@/lib/queries";
import { formatBDT, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Product details" };

export default async function AdminProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const pending = await getPendingRequestsForProduct(product.id);

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <AdminPageHeader
        title={product.name}
        description={`Product ID ${product.id}`}
        actions={
          <>
            {!product.is_archived && (
              <Button variant="outline" asChild>
                <Link href={`/products/${product.id}`} target="_blank">
                  <ExternalLink /> View public page
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href={`/admin/products/${product.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ProductRowActions product={product} afterDelete="/admin/products" />
          </>
        }
      />

      {(pending.changes > 0 || pending.deletions > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">This product has open requests:</span>
          {pending.changes > 0 && (
            <Link href={`/admin/change-requests?status=pending&q=${encodeURIComponent(product.name)}`} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
              <PencilRuler className="size-4" /> {pending.changes} change request{pending.changes === 1 ? "" : "s"}
            </Link>
          )}
          {pending.deletions > 0 && (
            <Link href={`/admin/deletion-requests?status=pending&q=${encodeURIComponent(product.name)}`} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
              <Trash2 className="size-4" /> {pending.deletions} deletion request{pending.deletions === 1 ? "" : "s"}
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-slate-50">
            <ProductImage src={product.image_url} alt={product.name} fit="contain" sizes="360px" className="p-4" />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Details</CardTitle>
              <div className="flex gap-2">
                <StatusBadge status={product.is_archived ? "archived" : "published"} />
                <AvailabilityBadge quantity={product.quantity} />
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Row label="Price">
                  <span className="text-lg font-bold text-primary">{formatBDT(product.price)}</span>
                </Row>
                <Row label="Quantity">{product.quantity}</Row>
                <Row label="Category">{product.category ?? "—"}</Row>
                <Row label="Colors">
                  <ColorSwatches colors={product.colors} max={12} showLabels />
                </Row>
                <Row label="Purchase link" className="sm:col-span-2">
                  {product.purchase_link ? (
                    <a href={product.purchase_link} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">
                      {product.purchase_link}
                    </a>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Description" className="sm:col-span-2">
                  <p className="whitespace-pre-line text-slate-700">{product.description ?? "—"}</p>
                </Row>
                <Row label="Date added">{formatDate(product.created_at, true)}</Row>
                <Row label="Last updated">{formatDate(product.updated_at, true)}</Row>
                {product.archived_at && <Row label="Archived on">{formatDate(product.archived_at, true)}</Row>}
              </dl>
            </CardContent>
          </Card>
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
