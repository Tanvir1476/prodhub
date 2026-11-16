import Link from "next/link";

import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/25",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 7v10l8 4 8-4V7z" />
        <path d="M4 7l8 4 8-4" />
        <path d="M12 11v10" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", light = false, className }: { href?: string; light?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <LogoMark />
      <span className={cn("text-lg", light ? "text-white" : "text-foreground")}>
        Prod<span className={light ? "text-violet-300" : "text-primary"}>Hub</span>
      </span>
      <span className="sr-only">{SITE_NAME}</span>
    </Link>
  );
}
