import Image from "next/image";
import { ImageOff, Package } from "lucide-react";

import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** "cover" for cards, "contain" for the big details view */
  fit?: "cover" | "contain";
  placeholderIcon?: "package" | "image";
}

/**
 * Renders a product image from Supabase Storage, or a branded placeholder.
 * Wrap it in a relatively positioned container with an aspect ratio.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  priority,
  fit = "cover",
  placeholderIcon = "package",
}: ProductImageProps) {
  if (!src) {
    const Icon = placeholderIcon === "image" ? ImageOff : Package;
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50",
          className
        )}
        aria-label="No image available"
      >
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            <Icon className="size-7" strokeWidth={1.5} />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider">No image</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
