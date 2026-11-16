import Link from "next/link";
import { ArrowUpRight, PencilLine } from "lucide-react";

import { ColorSwatches } from "@/components/product/color-swatches";
import { ProductImage } from "@/components/product/product-image";
import { AvailabilityBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { cn, formatBDT } from "@/lib/utils";

export function ProductCard({ product, className, priority }: { product: Product; className?: string; priority?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft card-hover",
        className
      )}
    >
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-50">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <AvailabilityBadge quantity={product.quantity} className="shadow-sm backdrop-blur" />
        </div>
        {product.category && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
            {product.category}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
            <Link href={`/products/${product.id}`} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
          <p className="shrink-0 text-base font-bold text-primary">{formatBDT(product.price)}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Qty: <span className="font-semibold text-foreground">{product.quantity}</span>
          </span>
          <ColorSwatches colors={product.colors} />
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Button size="sm" asChild>
            <Link href={`/products/${product.id}`}>
              View Details <ArrowUpRight />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/products/${product.id}/request-change`}>
              <PencilLine /> Suggest an Edit
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="aspect-[4/3] animate-pulse bg-slate-200/70" />
      <div className="space-y-3 p-5">
        <div className="flex justify-between gap-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/70" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200/70" />
        </div>
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200/70" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-8 animate-pulse rounded-md bg-slate-200/70" />
          <div className="h-8 animate-pulse rounded-md bg-slate-200/70" />
        </div>
      </div>
    </div>
  );
}
