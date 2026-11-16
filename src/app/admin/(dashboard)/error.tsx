"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-destructive">
          <AlertOctagon className="size-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      </div>
    </div>
  );
}
