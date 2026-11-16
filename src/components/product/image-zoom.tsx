"use client";

import Image from "next/image";
import { useState } from "react";
import { ZoomIn } from "lucide-react";

import { ProductImage } from "@/components/product/product-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ImageZoom({ src, alt }: { src: string | null; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => src && setOpen(true)}
        disabled={!src}
        className="group relative block aspect-square w-full overflow-hidden rounded-3xl border border-border bg-white shadow-soft disabled:cursor-default cursor-zoom-in"
        aria-label={src ? "Zoom product image" : "No product image"}
      >
        <ProductImage src={src} alt={alt} fit="contain" priority sizes="(max-width: 1024px) 100vw, 50vw" className="p-6" />
        {src && (
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100">
            <ZoomIn className="size-3.5" /> Zoom
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-2 sm:p-3">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {src && (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 sm:aspect-[4/3]">
              <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
