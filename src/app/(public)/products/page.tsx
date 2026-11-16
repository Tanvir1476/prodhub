import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, PlusCircle, X } from "lucide-react";

import { Pagination } from "@/components/pagination";
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import { ProductFilters } from "@/components/public/product-filters";
import { SearchBar } from "@/components/public/search-bar";
import { SortSelect } from "@/components/public/sort-select";
import { Button } from "@/components/ui/button";
import { getFilterFacets, listProducts, type ProductFilters as Filters } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Products",
  description: "Browse, search, filter and sort every product in the community catalogue.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const activeCount =
    (filters.category ? 1 : 0) + (filters.colors?.length ?? 0) + (filters.minPrice != null ? 1 : 0) + (filters.maxPrice != null ? 1 : 0) + (filters.inStock ? 1 : 0);

  const facets = await getFilterFacets();

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Catalogue</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Explore Products</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Search by name, narrow down by category, color or price, and open any product for the full picture.
        </p>
      </header>

      <div className="mt-8 max-w-2xl">
        <SearchBar size="md" defaultValue={filters.q ?? ""} autoFocus={sp.focus === "search"} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <ProductFilters facets={facets} activeCount={activeCount} />

        <div className="min-w-0">
          <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
            <Results filters={filters} sp={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function Results({ filters, sp }: { filters: Filters; sp: SearchParams }) {
  const { products, total, page, totalPages, pageSize } = await listProducts(filters);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === "page" || k === "focus" || v == null) continue;
      (Array.isArray(v) ? v : [v]).forEach((x) => params.append(k, x));
    }
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total === 0 ? (
            "No products found"
          ) : (
            <>
              Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
              <span className="font-semibold text-foreground">{total}</span> product{total === 1 ? "" : "s"}
              {filters.q && (
                <>
                  {" "}
                  for <span className="font-semibold text-foreground">&ldquo;{filters.q}&rdquo;</span>
                </>
              )}
            </>
          )}
        </p>
        <SortSelect value={filters.sort ?? "newest"} />
      </div>

      <ActiveChips filters={filters} sp={sp} />

      {products.length === 0 ? (
        <EmptyState hasQuery={Boolean(filters.q)} />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 3} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} className="mt-10" />
    </>
  );
}

function ActiveChips({ filters, sp }: { filters: Filters; sp: SearchParams }) {
  const chips: { label: string; remove: (p: URLSearchParams) => void }[] = [];
  if (filters.q) chips.push({ label: `Search: ${filters.q}`, remove: (p) => p.delete("q") });
  if (filters.category) chips.push({ label: filters.category, remove: (p) => p.delete("category") });
  for (const c of filters.colors ?? [])
    chips.push({
      label: `Color: ${c}`,
      remove: (p) => {
        const all = p.getAll("color").filter((x) => x !== c);
        p.delete("color");
        all.forEach((x) => p.append("color", x));
      },
    });
  if (filters.minPrice != null) chips.push({ label: `Min ৳${filters.minPrice}`, remove: (p) => p.delete("minPrice") });
  if (filters.maxPrice != null) chips.push({ label: `Max ৳${filters.maxPrice}`, remove: (p) => p.delete("maxPrice") });
  if (filters.inStock) chips.push({ label: "In stock only", remove: (p) => p.delete("inStock") });
  if (chips.length === 0) return null;

  const base = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || k === "focus" || v == null) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => base.append(k, x));
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((chip) => {
        const p = new URLSearchParams(base.toString());
        chip.remove(p);
        const s = p.toString();
        return (
          <Link
            key={chip.label}
            href={`/products${s ? `?${s}` : ""}`}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {chip.label} <X className="size-3" />
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <PackageSearch className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">No matching products</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasQuery
          ? "We couldn't find anything with that name. Try a different spelling or fewer filters."
          : "Nothing matches the selected filters yet. Try clearing a filter or add the product yourself."}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" asChild>
          <Link href="/products">Clear search &amp; filters</Link>
        </Button>
        <Button asChild>
          <Link href="/contribute">
            <PlusCircle /> Add a Product
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-10 w-[200px] animate-pulse rounded-lg bg-slate-200/70" />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

function parseFilters(sp: SearchParams): Filters {
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;
  const num = (v: string | string[] | undefined) => {
    const s = str(v);
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const colorsRaw = sp.color;
  const colors = (Array.isArray(colorsRaw) ? colorsRaw : colorsRaw ? [colorsRaw] : []).filter(Boolean).slice(0, 10);
  const sort = str(sp.sort);
  const validSort = ["newest", "oldest", "name_asc", "name_desc", "price_asc", "price_desc"].includes(sort ?? "")
    ? (sort as Filters["sort"])
    : "newest";

  return {
    q: str(sp.q)?.trim().slice(0, 100) || undefined,
    category: str(sp.category)?.slice(0, 60) || undefined,
    colors: colors.length ? colors : undefined,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    inStock: str(sp.inStock) === "1",
    sort: validSort,
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}
