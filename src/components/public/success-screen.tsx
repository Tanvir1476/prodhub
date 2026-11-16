import Link from "next/link";
import { CheckCircle2, Compass, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  title: string;
  message: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}

export function SuccessScreen({ title, message, primary, secondary }: SuccessScreenProps) {
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-lift animate-fade-up sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href={primary?.href ?? "/products"}>
              <Compass /> {primary?.label ?? "Explore Products"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={secondary?.href ?? "/contribute"}>
              <PlusCircle /> {secondary?.label ?? "Add another product"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
