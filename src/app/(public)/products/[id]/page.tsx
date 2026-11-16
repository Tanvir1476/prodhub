import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Layers,
  PencilLine,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";

import { ColorSwatches } from "@/components/product/color-swatches";
import { ImageZoom } from "@/components/product/image-zoom";
import { ProductCard } from "@/components/product/product-card";
import { ShareActions } from "@/components/product/share-actions";
import { AvailabilityBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProduct, getRelatedProducts } from "@/lib/queries";
import { formatBDT, formatDate, shortId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || product.is_archived) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — ${formatBDT(product.price)}`,
    openGraph: product.image_url ? { images: [{ url: product.image_url }] } : undefined,
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || product.is_archived) notFound();

  const related = await getRelatedProducts(product, 4);

  return (
    <div className="container-x py-8 sm:py-12">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image */}
        <div className="animate-fade-in">
          <ImageZoom src={product.image_url} alt={product.name} />
        </div>

        {/* Details */}
        <div className="flex flex-col animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge quantity={product.quantity} />
            {product.category && (
              <Badge variant="outline">
                <Tag /> {product.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">ID {shortId(product.id)}</span>
          </div>

          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>

          <p className="mt-4 text-3xl font-extrabold text-primary sm:text-4xl">{formatBDT(product.price)}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Layers className="size-3.5" /> Quantity
              </dt>
              <dd className="mt-1 text-lg font-semibold">{product.quantity}</dd>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available colors</dt>
              <dd className="mt-2">
                <ColorSwatches colors={product.colors} max={12} size="md" showLabels />
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h2>
            {product.description ? (
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{product.description}</p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground">
                No description yet.{" "}
                <Link href={`/products/${product.id}/request-change?field=description`} className="not-italic font-medium text-primary hover:underline">
                  Suggest one →
                </Link>
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {product.purchase_link ? (
              <Button size="lg" variant="gradient" asChild>
                <a href={product.purchase_link} target="_blank" rel="noopener noreferrer nofollow">
                  <ExternalLink /> Visit Store
                </a>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <Link href={`/products/${product.id}/request-change?field=purchase_link`}>
                  <ExternalLink /> Know where to buy it? Add a link
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href={`/products/${product.id}/request-change`}>
                <PencilLine /> Request a Change
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-destructive hover:bg-red-50 hover:text-destructive" asChild>
              <Link href={`/products/${product.id}/request-removal`}>
                <Trash2 /> Request Removal
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> Added {formatDate(product.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="size-3.5" /> Last updated {formatDate(product.updated_at)}
              </span>
            </div>
            <ShareActions title={product.name} text={`${product.name} — ${formatBDT(product.price)} on ProdHub`} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">You may also like</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                {product.category ? `More in ${product.category}` : "More products"}
              </h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href={product.category ? `/products?category=${encodeURIComponent(product.category)}` : "/products"}>
                See all
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
