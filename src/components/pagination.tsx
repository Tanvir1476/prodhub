import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page */
  hrefFor: (page: number) => string;
  className?: string;
}

export function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </PageLink>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <PageLink key={p} href={hrefFor(p)} active={p === page} aria-current={p === page ? "page" : undefined}>
            {p}
          </PageLink>
        )
      )}
      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: { href: string; active?: boolean; disabled?: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const base = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors";
  if (disabled)
    return (
      <span className={cn(base, "cursor-not-allowed text-muted-foreground/50")} {...rest}>
        {children}
      </span>
    );
  return (
    <Link
      href={href}
      className={cn(base, active ? "bg-primary text-white shadow-sm" : "text-slate-700 hover:bg-muted")}
      {...rest}
    >
      {children}
    </Link>
  );
}

function visiblePages(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => set.add(p));
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
