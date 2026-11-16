"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitDeletionRequest } from "@/lib/actions/public";
import type { Product } from "@/lib/types";
import { shortId } from "@/lib/utils";

const REASONS = [
  "Product is discontinued",
  "Duplicate of another listing",
  "Listing is spam or misleading",
  "Product is not available anywhere",
  "Other",
];

export function DeletionRequestForm({ product }: { product: Product }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [reasonType, setReasonType] = useState<string>("");
  const [reasonText, setReasonText] = useState("");

  const combinedReason = reasonType && reasonType !== "Other" ? `${reasonType}${reasonText ? ` — ${reasonText}` : ""}` : reasonText;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("reason", combinedReason);
    setErrors({});
    startTransition(async () => {
      const result = await submitDeletionRequest(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Removal request submitted");
      router.push(`/products/${product.id}/request-removal/thank-you?ref=${result.data?.id ?? ""}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website_url_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="product_id" value={product.id} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Product name" htmlFor="dr-product-name">
          <Input id="dr-product-name" value={product.name} readOnly className="bg-muted/60" />
        </Field>
        <Field label="Product ID" htmlFor="dr-product-id">
          <Input id="dr-product-id" value={`${shortId(product.id)} (${product.id})`} readOnly className="bg-muted/60 font-mono text-xs" />
        </Field>
      </div>

      <Field label="Reason for removal" htmlFor="dr-reason-type" required error={errors.reason}>
        <Select value={reasonType} onValueChange={setReasonType}>
          <SelectTrigger id="dr-reason-type">
            <SelectValue placeholder="Select the main reason" />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={reasonType === "Other" || !reasonType ? "Explain the reason" : "Details"}
        htmlFor="dr-reason"
        required={reasonType === "Other" || !reasonType}
        optional={Boolean(reasonType) && reasonType !== "Other"}
        hint="At least 10 characters in total. Be specific so the Admin can verify quickly."
      >
        <Textarea
          id="dr-reason"
          rows={4}
          maxLength={1900}
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          placeholder="e.g. The manufacturer discontinued this model in 2025 and it is no longer sold anywhere."
        />
      </Field>

      <Field label="Additional information" htmlFor="dr-additional" optional error={errors.additional_info} hint="Links to proof, a replacement product, or anything else that helps.">
        <Textarea id="dr-additional" name="additional_info" rows={3} maxLength={2000} placeholder="Optional" />
      </Field>

      <Field label="Your name" htmlFor="dr-name" optional hint="Visible only to the Admin.">
        <Input id="dr-name" name="submitter_name" maxLength={80} placeholder="Anonymous" autoComplete="name" />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">The product remains visible until the Admin approves this request.</p>
        <Button type="submit" size="lg" variant="destructive" loading={pending} className="sm:min-w-48">
          {!pending && <Send />} Request Removal
        </Button>
      </div>
    </form>
  );
}
