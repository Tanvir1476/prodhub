import { ProductCardSkeleton } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="container-x py-10 sm:py-14">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <Skeleton className="mt-8 h-14 w-full max-w-2xl rounded-2xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-2xl lg:block" />
        <div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-[200px]" />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
