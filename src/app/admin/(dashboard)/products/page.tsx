import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Package, Plus } from "lucide-react";

import { AdminParamSelect, AdminSearch } from "@/components/admin/admin-search";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Pagination } from "@/components/pagination";
import { ColorSwatches } from "@/components/product/color-swatches";
import { ProductImage } from "@/components/product/product-image";
import { AvailabilityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORIES } from "@/lib/constants";
import { listProducts } from "@/lib/queries";
import { formatBDT, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

type SP = { q?: string; view?: string; category?: string; sort?: string; page?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const view = sp.view === "archived" ? "archived" : sp.view === "all" ? "all" : "active";
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await listProducts({
    q: sp.q,
    category: sp.category,
    sort: (["newest", "oldest", "name_asc", "name_desc", "price_asc", "price_desc"].includes(sp.sort ?? "") ? sp.sort : "newest") as never,
    page,
    pageSize: 20,
    archived: view,
  });
  const products = result.products;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Everything currently in the catalogue, including archived items."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> Add Product
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <AdminSearch placeholder="Search by product name…" className="lg:w-80" />
        <div className="flex flex-wrap gap-3">
          <AdminParamSelect
            param="view"
            value={view}
            placeholder="View"
            options={[
              { value: "active", label: "Published only" },
              { value: "archived", label: "Archived only" },
              { value: "all", label: "All products" },
            ]}
          />
          <AdminParamSelect
            param="category"
            value={sp.category ?? "all"}
            placeholder="Category"
            options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <AdminParamSelect
            param="sort"
            value={sp.sort ?? "newest"}
            placeholder="Sort"
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "name_asc", label: "Name A → Z" },
              { value: "price_desc", label: "Price high → low" },
              { value: "price_asc", label: "Price low → high" },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {products.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="size-7" />
            </span>
            <h3 className="mt-4 font-semibold">No products here</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {sp.q ? "Nothing matches your search." : view === "archived" ? "No archived products." : "Add your first product to get started."}
            </p>
            {!sp.q && view !== "archived" && (
              <Button className="mt-6" asChild>
                <Link href="/admin/products/new">
                  <Plus /> Add Product
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell">Colors</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className={p.is_archived ? "opacity-70" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                        <ProductImage src={p.image_url} alt={p.name} sizes="48px" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-semibold hover:text-primary">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">Added {formatDate(p.created_at)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{formatBDT(p.price)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{p.quantity}</span>
                      <AvailabilityBadge quantity={p.quantity} className="w-fit" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ColorSwatches colors={p.colors} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{p.category ?? "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(p.updated_at)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.is_archived ? "archived" : "published"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!p.is_archived && (
                        <Button variant="ghost" size="icon-sm" asChild aria-label="View on public site">
                          <Link href={`/products/${p.id}`} target="_blank">
                            <ExternalLink />
                          </Link>
                        </Button>
                      )}
                      <ProductRowActions product={p} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {result.total} product{result.total === 1 ? "" : "s"} in total
        </p>
        <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
