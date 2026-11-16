"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareActions({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success("Product link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. You can copy it from the address bar.");
    }
  };

  const share = async () => {
    const url = getUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await copy();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copy} aria-label="Copy product link">
        {copied ? <Check className="text-emerald-600" /> : <Copy />} {copied ? "Copied" : "Copy link"}
      </Button>
      <Button variant="outline" size="sm" onClick={share} aria-label="Share product">
        <Share2 /> Share
      </Button>
    </div>
  );
}
