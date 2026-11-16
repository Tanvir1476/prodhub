import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { FIELD_LABELS } from "@/lib/constants";
import type { RequestedChanges } from "@/lib/types";
import { cn, formatBDT } from "@/lib/utils";

/** Side-by-side "current → proposed" view of a change request. */
export function ChangeDiff({ changes, compact }: { changes: RequestedChanges; compact?: boolean }) {
  const entries = Object.entries(changes ?? {});
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No changes listed.</p>;

  return (
    <ul className={cn("space-y-3", compact && "space-y-2")}>
      {entries.map(([field, change]) => (
        <li key={field} className={cn("rounded-xl border border-border bg-slate-50/60", compact ? "p-3" : "p-4")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{FIELD_LABELS[field] ?? field}</p>
          <div className={cn("mt-2 grid items-start gap-2", "sm:grid-cols-[1fr_auto_1fr]")}>
            <Value field={field} value={change?.current ?? ""} tone="current" compact={compact} />
            <ArrowRight className="hidden size-4 self-center text-muted-foreground sm:block" />
            <Value field={field} value={change?.proposed ?? ""} tone="proposed" compact={compact} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Value({ field, value, tone, compact }: { field: string; value: string; tone: "current" | "proposed"; compact?: boolean }) {
  const label = tone === "current" ? "Current" : "Proposed";
  const base = cn(
    "rounded-lg border px-3 py-2 text-sm",
    tone === "current" ? "border-border bg-card text-slate-600" : "border-emerald-200 bg-emerald-50 text-emerald-900"
  );

  if (field === "image_url") {
    return (
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
        {value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className={cn("relative block overflow-hidden rounded-lg border", compact ? "size-20" : "h-40 w-full", tone === "proposed" ? "border-emerald-200" : "border-border")}>
            <Image src={value} alt={`${label} image`} fill sizes="320px" className="object-cover" />
          </a>
        ) : (
          <p className={cn(base, "italic")}>No image</p>
        )}
      </div>
    );
  }

  const display = field === "price" && value ? formatBDT(value) : value;
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn(base, "whitespace-pre-line break-words", compact && "line-clamp-3")}>
        {display || <span className="italic opacity-70">Empty</span>}
      </p>
    </div>
  );
}
