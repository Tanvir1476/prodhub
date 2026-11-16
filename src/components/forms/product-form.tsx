"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { ColorInput } from "@/components/forms/color-input";
import { Field } from "@/components/forms/field";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/constants";
import type { ActionResult, Product } from "@/lib/types";

interface ProductFormProps {
  mode: "contribute" | "admin-create" | "admin-edit";
  initial?: Partial<Product> | null;
  action: (formData: FormData) => Promise<ActionResult<{ id?: string }>>;
  /** Where to go after success. "{id}" is replaced with the created/updated product id. */
  successHref?: string;
  submitLabel?: string;
}

export function ProductForm({ mode, initial, action, successHref, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [category, setCategory] = useState<string>(initial?.category ?? "none");

  const isContribute = mode === "contribute";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        const firstKey = Object.keys(result.fieldErrors ?? {})[0];
        if (firstKey) document.getElementById(`pf-${firstKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      toast.success(result.message ?? "Saved successfully.");
      const id = result.data?.id ?? initial?.id ?? "";
      const href = successHref?.replace("{id}", id);
      if (href) router.push(href);
      else formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Honeypot — invisible to humans, filled by naive bots */}
      {isContribute && (
        <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
          <label>
            Website
            <input type="text" name="website_url_confirm" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      )}

      <section className="space-y-5">
        <SectionTitle step={1} title="Basic information" text="What is the product and how much does it cost?" />

        <Field label="Product name" htmlFor="pf-name" required error={errors.name}>
          <Input
            id="pf-name"
            name="name"
            defaultValue={initial?.name ?? ""}
            placeholder="e.g. Wireless Noise-Cancelling Headphones"
            maxLength={160}
            required
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (BDT ৳)" htmlFor="pf-price" required error={errors.price} hint="Use the regular retail price in Taka.">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">
                ৳
              </span>
              <Input
                id="pf-price"
                name="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                defaultValue={initial?.price ?? ""}
                placeholder="0.00"
                className="pl-8"
                required
                aria-invalid={Boolean(errors.price)}
              />
            </div>
          </Field>

          <Field label="Quantity" htmlFor="pf-quantity" required error={errors.quantity} hint="How many units are available right now.">
            <Input
              id="pf-quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={initial?.quantity ?? ""}
              placeholder="0"
              required
              aria-invalid={Boolean(errors.quantity)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="pf-category" optional error={errors.category}>
            <input type="hidden" name="category" value={category === "none" ? "" : category} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="pf-category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Colors" htmlFor="pf-colors" optional error={errors.colors} hint="Press Enter after each color. Add as many as apply.">
            <ColorInput id="pf-colors" name="colors" defaultValue={initial?.colors ?? []} />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle step={2} title="Details & media" text="Help others recognise and find the product." />

        <ImageUploadField
          name="image"
          initialUrl={initial?.image_url ?? null}
          removeFlagName={mode === "admin-edit" ? "remove_image" : undefined}
          error={errors.image?.[0]}
        />

        <Field label="Purchase link" htmlFor="pf-purchase_link" optional error={errors.purchase_link} hint="A page where the product can be bought.">
          <Input
            id="pf-purchase_link"
            name="purchase_link"
            type="url"
            inputMode="url"
            defaultValue={initial?.purchase_link ?? ""}
            placeholder="https://store.example.com/product"
            aria-invalid={Boolean(errors.purchase_link)}
          />
        </Field>

        <Field label="Description" htmlFor="pf-description" optional error={errors.description} hint="Up to 2,000 characters.">
          <Textarea
            id="pf-description"
            name="description"
            defaultValue={initial?.description ?? ""}
            placeholder="Key features, what's included, sizing, materials…"
            maxLength={2000}
            rows={5}
            aria-invalid={Boolean(errors.description)}
          />
        </Field>

        {isContribute && (
          <Field label="Your name" htmlFor="pf-submitter_name" optional hint="Shown only to the Admin. Leave blank to contribute anonymously.">
            <Input id="pf-submitter_name" name="submitter_name" maxLength={80} placeholder="e.g. Tanvir" autoComplete="name" />
          </Field>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isContribute
            ? "Your submission stays private until the Admin approves and publishes it."
            : "Changes are published immediately and recorded in the activity log."}
        </p>
        <Button type="submit" size="lg" loading={pending} className="sm:min-w-48">
          {!pending && <Send />}
          {submitLabel ?? (isContribute ? "Submit Contribution" : mode === "admin-edit" ? "Save changes" : "Publish product")}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ step, title, text }: { step: number; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {step}
      </span>
      <div>
        <h2 className="font-semibold leading-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
