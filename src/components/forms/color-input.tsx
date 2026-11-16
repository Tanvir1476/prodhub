"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { COLOR_SUGGESTIONS } from "@/lib/constants";
import { cn, colorToCss } from "@/lib/utils";

interface ColorInputProps {
  name: string;
  id?: string;
  defaultValue?: string[];
  placeholder?: string;
}

/**
 * Tag-style multi-color input. Submits a single comma-separated hidden field
 * so it works with plain FormData on the server.
 */
export function ColorInput({ name, id, defaultValue = [], placeholder = "Type a color and press Enter" }: ColorInputProps) {
  const [colors, setColors] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const value = raw.trim().replace(/,+$/, "");
    if (!value) return;
    if (colors.some((c) => c.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    if (colors.length >= 12) return;
    setColors([...colors, value.slice(0, 40)]);
    setDraft("");
  };

  const remove = (value: string) => setColors(colors.filter((c) => c !== value));

  const suggestions = COLOR_SUGGESTIONS.filter((s) => !colors.some((c) => c.toLowerCase() === s.toLowerCase())).slice(0, 10);

  return (
    <div className="space-y-2.5">
      <input type="hidden" name={name} value={colors.join(", ")} />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-card px-2 py-1.5 shadow-xs focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        {colors.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium"
          >
            <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: colorToCss(c) }} />
            {c}
            <button
              type="button"
              onClick={() => remove(c)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-slate-200 hover:text-foreground cursor-pointer"
              aria-label={`Remove ${c}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && draft === "" && colors.length) {
              remove(colors[colors.length - 1]);
            }
          }}
          onBlur={() => add(draft)}
          placeholder={colors.length ? "Add another…" : placeholder}
          className="h-8 min-w-[140px] flex-1 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
              )}
            >
              <span className="size-2.5 rounded-full border border-black/10" style={{ backgroundColor: colorToCss(s) }} />
              {s}
              <Plus className="size-2.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
