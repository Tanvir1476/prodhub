import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Info } from "lucide-react";

import { ChangeRequestForm } from "@/components/forms/change-request-form";
import { ProductSummaryCard } from "@/components/product/product-summary-card";
import { PageIntro } from "@/components/public/page-intro";
import { getProduct } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? `Request a Change · ${product.name}` : "Request a Change" };
}

export default async function RequestChangePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ field?: string }>;
}) {
  const { id } = await params;
  const { field } = await searchParams;
  const product = await getProduct(id);
  if (!product || product.is_archived) notFound();

  return (
    <div className="container-x py-10 sm:py-14">
      <PageIntro
        eyebrow="Change request"
        title="Request a Change"
        text="Spotted something wrong or outdated? Tell us what should change. The Admin reviews every request before the product is updated."
        back={{ href: `/products/${product.id}`, label: "Back to product" }}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="relative rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <ChangeRequestForm product={product} initialField={field} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">You are editing</p>
            <ProductSummaryCard product={product} />
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-sm text-indigo-900/80">
            <h2 className="flex items-center gap-2 font-semibold text-indigo-900">
              <Info className="size-4" /> Good to know
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                "Each request gets a unique ID and is marked Pending.",
                "The product stays exactly as it is until approval.",
                "Evidence (a screenshot or receipt) speeds up review.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
