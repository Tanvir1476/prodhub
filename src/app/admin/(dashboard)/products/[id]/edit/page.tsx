import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/forms/product-form";
import { updateProduct } from "@/lib/actions/admin";
import { getProduct } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit Product" };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div className="space-y-6">
      <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to product
      </Link>
      <AdminPageHeader title="Edit Product" description={product.name} />
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <ProductForm mode="admin-edit" initial={product} action={action} successHref={`/admin/products/${product.id}`} />
      </div>
    </div>
  );
}
