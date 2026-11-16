import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/forms/product-form";
import { createProduct } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Add Product" };

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <AdminPageHeader title="Add Product" description="Products you add here are published immediately — no review step." />
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <ProductForm mode="admin-create" action={createProduct} successHref="/admin/products/{id}" />
      </div>
    </div>
  );
}
