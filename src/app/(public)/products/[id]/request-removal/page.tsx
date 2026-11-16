import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { DeletionRequestForm } from "@/components/forms/deletion-request-form";
import { ProductSummaryCard } from "@/components/product/product-summary-card";
import { PageIntro } from "@/components/public/page-intro";
import { getProduct } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? `Request Removal · ${product.name}` : "Request Removal" };
}

export default async function RequestRemovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || product.is_archived) notFound();

  return (
    <div className="container-x py-10 sm:py-14">
      <PageIntro
        eyebrow="Removal request"
        title="Request Product Removal"
        text="Think this listing should no longer be in the catalogue? Let the Admin know why. Nothing is deleted until the request is reviewed and approved."
        back={{ href: `/products/${product.id}`, label: "Back to product" }}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="relative rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Removal is reserved for listings that are discontinued, duplicated, misleading or otherwise shouldn&apos;t be here. For
              incorrect details, please{" "}
              <a href={`/products/${product.id}/request-change`} className="font-semibold underline underline-offset-2">
                request a change
              </a>{" "}
              instead.
            </p>
          </div>
          <DeletionRequestForm product={product} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product in question</p>
          <ProductSummaryCard product={product} />
        </aside>
      </div>
    </div>
  );
}
