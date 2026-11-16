"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;

export function StatusTabs({
  value,
  counts,
  searchPlaceholder = "Search…",
}: {
  value: string;
  counts?: Partial<Record<(typeof TABS)[number]["value"], number>>;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      if (next.toString() !== params.toString()) router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex h-10 items-center gap-1 self-start rounded-xl bg-muted p-1">
        {TABS.map((t) => {
          const active = value === t.value;
          const count = counts?.[t.value];
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.set("status", t.value);
                router.push(`${pathname}?${next.toString()}`, { scroll: false });
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {count != null && count > 0 && (
                <span className={cn("rounded-full px-1.5 text-[11px] font-bold", active ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-600")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="pl-9" aria-label="Search" />
      </div>
    </div>
  );
}
