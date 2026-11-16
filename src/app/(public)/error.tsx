"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertOctagon, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfig = /environment variable|supabase/i.test(error.message);

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 text-destructive">
          <AlertOctagon className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isConfig
            ? "The application couldn't reach its database. If you're setting up the project, check your .env.local values."
            : "An unexpected error occurred while loading this page. Please try again."}
        </p>
        {error.digest && <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw /> Try again
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
