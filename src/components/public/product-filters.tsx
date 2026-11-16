"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Check, FilterX, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, colorToCss } from "@/lib/utils";

interface Facets {
  categories: { name: string; count: number }[];
  colors: { name: string; count: number }[];
  maxPrice: number;
}

export function ProductFilters({ facets, activeCount }: { facets: Facets; activeCount: number }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="size-4 text-primary" /> Filters
            </h2>
            {activeCount > 0 && <ClearFilters />}
          </div>
          <FilterBody facets={facets} />
        </div>
      </aside>

      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <SlidersHorizontal /> Filters
              {activeCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[11px] text-white">{activeCount}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh]">
            <SheetHeader>
              <SheetTitle>Filter products</SheetTitle>
              <SheetDescription>Narrow the catalogue by category, color and price.</SheetDescription>
            </SheetHeader>
            <FilterBody facets={facets} />
            {activeCount > 0 && (
              <div className="mt-4">
                <ClearFilters full />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page");
      startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router]
  );

  return { params, update, pending };
}

function ClearFilters({ full }: { full?: boolean }) {
  const { params, update } = useFilterNavigation();
  return (
    <Button
      variant={full ? "outline" : "ghost"}
      size="sm"
      className={cn(full && "w-full")}
      onClick={() =>
        update((p) => {
          const q = params.get("q");
          const sort = params.get("sort");
          [...p.keys()].forEach((k) => p.delete(k));
          if (q) p.set("q", q);
          if (sort) p.set("sort", sort);
        })
      }
    >
      <FilterX /> Clear
    </Button>
  );
}

function FilterBody({ facets }: { facets: Facets }) {
  const { params, update, pending } = useFilterNavigation();
  const selectedCategory = params.get("category") ?? "";
  const selectedColors = params.getAll("color");
  const inStock = params.get("inStock") === "1";
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");

  return (
    <div className={cn("mt-5 space-y-7 transition-opacity", pending && "opacity-60")}>
      {/* Availability */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Availability</h3>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox
            checked={inStock}
            onCheckedChange={(v) => update((p) => (v ? p.set("inStock", "1") : p.delete("inStock")))}
          />
          In stock only
        </label>
      </section>

      {/* Category */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</h3>
        {facets.categories.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            <li>
              <CategoryRow
                label="All categories"
                active={selectedCategory === ""}
                onClick={() => update((p) => p.delete("category"))}
              />
            </li>
            {facets.categories.map((c) => (
              <li key={c.name}>
                <CategoryRow
                  label={c.name}
                  count={c.count}
                  active={selectedCategory === c.name}
                  onClick={() => update((p) => p.set("category", c.name))}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Colors */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</h3>
        {facets.colors.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No colors yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const active = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() =>
                    update((p) => {
                      const current = p.getAll("color");
                      p.delete("color");
                      const next = active ? current.filter((x) => x !== c.name) : [...current, c.name];
                      next.forEach((x) => p.append("color", x));
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border bg-card text-slate-600 hover:border-slate-300"
                  )}
                  aria-pressed={active}
                >
                  <span
                    className="size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: colorToCss(c.name) }}
                  />
                  {c.name}
                  {active && <Check className="size-3" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Price */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price range (৳)</h3>
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              if (min) p.set("minPrice", min);
              else p.delete("minPrice");
              if (max) p.set("maxPrice", max);
              else p.delete("maxPrice");
            });
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minPrice" className="sr-only">
                Minimum price
              </Label>
              <Input id="minPrice" type="number" min={0} inputMode="decimal" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="sr-only">
                Maximum price
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={facets.maxPrice ? `Max ${Math.ceil(facets.maxPrice)}` : "Max"}
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="sm" variant="secondary" className="w-full">
            Apply price range
          </Button>
        </form>
      </section>
    </div>
  );
}

function CategoryRow({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer",
        active ? "bg-primary/8 font-semibold text-primary" : "text-slate-700 hover:bg-muted"
      )}
      aria-pressed={active}
    >
      <span className="truncate">{label}</span>
      {count != null && <span className="text-xs text-muted-foreground">{count}</span>}
    </button>
  );
}
