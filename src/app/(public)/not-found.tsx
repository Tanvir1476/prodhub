import Link from "next/link";
import { Compass, Home, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-md text-center animate-fade-up">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchX className="size-8" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          The product may have been removed, or the link might be out of date.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/products">
              <Compass /> Explore Products
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home /> Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
