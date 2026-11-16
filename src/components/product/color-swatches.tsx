import { cn, colorToCss } from "@/lib/utils";

interface ColorSwatchesProps {
  colors: string[] | null | undefined;
  max?: number;
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
}

export function ColorSwatches({ colors, max = 4, size = "sm", showLabels = false, className }: ColorSwatchesProps) {
  const list = (colors ?? []).filter(Boolean);
  if (list.length === 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Color not specified</span>;
  }
  const visible = list.slice(0, max);
  const extra = list.length - visible.length;
  const dot = size === "sm" ? "size-4" : "size-6";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5" title={c}>
          <span
            className={cn(dot, "rounded-full border border-black/10 shadow-inner ring-1 ring-white")}
            style={{ backgroundColor: colorToCss(c) }}
            aria-hidden
          />
          {showLabels && <span className="text-sm text-slate-700">{c}</span>}
          {!showLabels && <span className="sr-only">{c}</span>}
        </span>
      ))}
      {extra > 0 && <span className="text-xs font-medium text-muted-foreground">+{extra}</span>}
    </div>
  );
}
