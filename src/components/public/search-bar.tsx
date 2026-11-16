"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchBar({
  defaultValue = "",
  autoFocus,
  size = "lg",
  className,
  placeholder = "Search products by name…",
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  size?: "lg" | "md";
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [syncedDefault, setSyncedDefault] = useState(defaultValue);
  if (syncedDefault !== defaultValue) {
    // Keep the field in sync when the URL query changes (e.g. chips removed).
    setSyncedDefault(defaultValue);
    setValue(defaultValue);
  }
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
      }}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border bg-white p-1.5 shadow-lift transition-shadow focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10",
        size === "lg" ? "pl-4" : "pl-3",
        className
      )}
    >
      <Search className={cn("shrink-0 text-muted-foreground", size === "lg" ? "size-5" : "size-4")} />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70",
          size === "lg" ? "h-11 text-base" : "h-9 text-sm"
        )}
      />
      <Button type="submit" size={size === "lg" ? "lg" : "default"} className={size === "lg" ? "h-11" : ""}>
        Search <ArrowRight className="hidden sm:block" />
      </Button>
    </form>
  );
}
