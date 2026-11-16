import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  text?: string;
  back?: { href: string; label: string };
  className?: string;
}

export function PageIntro({ eyebrow, title, text, back, className }: PageIntroProps) {
  return (
    <header className={cn("max-w-2xl", className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> {back.label}
        </Link>
      )}
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
      <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {text && <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">{text}</p>}
    </header>
  );
}
