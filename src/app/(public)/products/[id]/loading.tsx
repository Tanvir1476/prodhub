import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container-x py-8 sm:py-12">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
