import Link from "next/link";

import { ColorSwatches } from "@/components/product/color-swatches";
import { ProductImage } from "@/components/product/product-image";
import { AvailabilityBadge } from "@/components/status-badge";
import type { Product } from "@/lib/types";
import { formatBDT, formatDate, shortId } from "@/lib/utils";

/** Compact product reference used on request forms. */
export function ProductSummaryCard({ product }: { product: Product }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
          <ProductImage src={product.image_url} alt={product.name} sizes="96px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Product ID {shortId(product.id)}</p>
          <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug">
            <Link href={`/products/${product.id}`} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-bold text-primary">{formatBDT(product.price)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AvailabilityBadge quantity={product.quantity} />
            <ColorSwatches colors={product.colors} />
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Quantity</dt>
          <dd className="font-medium">{product.quantity}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Category</dt>
          <dd className="font-medium">{product.category ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Added</dt>
          <dd className="font-medium">{formatDate(product.created_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="font-medium">{formatDate(product.updated_at)}</dd>
        </div>
      </dl>
    </div>
  );
}
