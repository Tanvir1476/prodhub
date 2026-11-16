"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ColorInput } from "@/components/forms/color-input";
import { Field } from "@/components/forms/field";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitChangeRequest } from "@/lib/actions/public";
import { CATEGORIES, CHANGEABLE_FIELDS } from "@/lib/constants";
import type { ChangeableField, Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils";

interface Row {
  key: number;
  field: ChangeableField | "";
}

export function ChangeRequestForm({ product, initialField }: { product: Product; initialField?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const validInitial = CHANGEABLE_FIELDS.some((f) => f.value === initialField) ? (initialField as ChangeableField) : "";
  const [rows, setRows] = useState<Row[]>([{ key: 1, field: validInitial }]);

  const usedFields = rows.map((r) => r.field).filter(Boolean);
  const canAdd = rows.length < CHANGEABLE_FIELDS.length;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});
    startTransition(async () => {
      const result = await submitChangeRequest(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Change request submitted");
      router.push(`/products/${product.id}/request-change/thank-you?ref=${result.data?.id ?? ""}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website_url_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="product_id" value={product.id} />

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">What needs to change?</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick a field, and we&apos;ll show the current value so you can propose the correct one. You can request several changes at once.
          </p>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <ChangeRow
              key={row.key}
              index={index}
              row={row}
              product={product}
              usedFields={usedFields}
              error={errors[`changes.${index}.proposed`]?.[0] ?? errors[`changes.${index}.field`]?.[0]}
              imageError={errors.new_image?.[0]}
              onFieldChange={(field) => setRows(rows.map((r) => (r.key === row.key ? { ...r, field } : r)))}
              onRemove={rows.length > 1 ? () => setRows(rows.filter((r) => r.key !== row.key)) : undefined}
            />
          ))}
        </div>

        {errors.changes && <p className="text-xs font-medium text-destructive">{errors.changes[0]}</p>}

        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows([...rows, { key: Date.now(), field: "" }])}
          >
            <Plus /> Add another field
          </Button>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-semibold">Why should this change?</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">A clear reason helps the Admin verify and approve your request quickly.</p>
        </div>

        <Field label="Reason for the change" htmlFor="cr-reason" required error={errors.reason}>
          <Textarea
            id="cr-reason"
            name="reason"
            rows={4}
            maxLength={2000}
            placeholder="e.g. The store page now lists this product at ৳1,150 — see the attached screenshot."
            required
            aria-invalid={Boolean(errors.reason)}
          />
        </Field>

        <ImageUploadField
          name="evidence"
          label="Supporting image or evidence"
          hint="Screenshot, receipt or photo · JPG, PNG, WEBP up to 5 MB"
          error={errors.evidence?.[0]}
        />

        <Field label="Your name" htmlFor="cr-name" optional hint="Visible only to the Admin.">
          <Input id="cr-name" name="submitter_name" maxLength={80} placeholder="Anonymous" autoComplete="name" />
        </Field>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">The product stays unchanged until the Admin approves this request.</p>
        <Button type="submit" size="lg" loading={pending} className="sm:min-w-48">
          {!pending && <Send />} Submit Request
        </Button>
      </div>
    </form>
  );
}

function ChangeRow({
  index,
  row,
  product,
  usedFields,
  error,
  imageError,
  onFieldChange,
  onRemove,
}: {
  index: number;
  row: Row;
  product: Product;
  usedFields: string[];
  error?: string;
  imageError?: string;
  onFieldChange: (f: ChangeableField) => void;
  onRemove?: () => void;
}) {
  const field = row.field;
  const current = field ? currentValue(product, field) : "";
  const meta = CHANGEABLE_FIELDS.find((f) => f.value === field);

  return (
    <div className="rounded-2xl border border-border bg-slate-50/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor={`cr-field-${row.key}`}>
            Field to change <span className="text-destructive">*</span>
          </label>
          <input type="hidden" name={`changes[${index}][field]`} value={field} />
          <input type="hidden" name={`changes[${index}][current]`} value={current} />
          <Select value={field} onValueChange={(v) => onFieldChange(v as ChangeableField)}>
            <SelectTrigger id={`cr-field-${row.key}`} className="bg-card">
              <SelectValue placeholder="Choose a field…" />
            </SelectTrigger>
            <SelectContent>
              {CHANGEABLE_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value} disabled={f.value !== field && usedFields.includes(f.value)}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {meta && <p className="text-xs text-muted-foreground">{meta.hint}</p>}
        </div>
        {onRemove && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove this change" className="mt-6 text-muted-foreground hover:text-destructive">
            <Trash2 />
          </Button>
        )}
      </div>

      {field && (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current value</span>
            <CurrentValueDisplay field={field} value={current} />
          </div>
          <ArrowRight className="hidden size-5 text-muted-foreground md:mt-9 md:block" />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-primary" htmlFor={`cr-proposed-${row.key}`}>
              Proposed new value <span className="text-destructive">*</span>
            </label>
            <ProposedInput id={`cr-proposed-${row.key}`} name={`changes[${index}][proposed]`} field={field} imageError={imageError} />
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrentValueDisplay({ field, value }: { field: ChangeableField; value: string }) {
  if (field === "image_url") {
    return value ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="Current product image" className="h-28 w-28 rounded-lg border border-border object-cover" />
    ) : (
      <p className="rounded-lg border border-dashed border-border bg-card px-3 py-2 text-sm italic text-muted-foreground">No image yet</p>
    );
  }
  const display = field === "price" ? formatBDT(value) : value;
  return (
    <p className="min-h-10 whitespace-pre-line rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700">
      {display || <span className="italic text-muted-foreground">Empty</span>}
    </p>
  );
}

function ProposedInput({ id, name, field, imageError }: { id: string; name: string; field: ChangeableField; imageError?: string }) {
  const [category, setCategory] = useState<string>("");
  switch (field) {
    case "name":
      return <Input id={id} name={name} maxLength={160} placeholder="Correct product name" required className="bg-card" />;
    case "quantity":
      return <Input id={id} name={name} type="number" min={0} step={1} inputMode="numeric" placeholder="0" required className="bg-card" />;
    case "price":
      return (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground">৳</span>
          <Input id={id} name={name} type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" required className="bg-card pl-8" />
        </div>
      );
    case "colors":
      return <ColorInput id={id} name={name} placeholder="Add colors and press Enter" />;
    case "purchase_link":
      return <Input id={id} name={name} type="url" inputMode="url" placeholder="https://store.example.com/product" required className="bg-card" />;
    case "description":
      return <Textarea id={id} name={name} rows={4} maxLength={2000} placeholder="Improved description" required className="bg-card" />;
    case "category":
      return (
        <>
          <input type="hidden" name={name} value={category} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id={id} className="bg-card">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      );
    case "image_url":
      return (
        <>
          <input type="hidden" name={name} value="(new image upload)" />
          <ImageUploadField name="new_image" label="New image" required error={imageError} />
        </>
      );
  }
}

function currentValue(product: Product, field: ChangeableField): string {
  switch (field) {
    case "name":
      return product.name;
    case "quantity":
      return String(product.quantity);
    case "price":
      return Number(product.price).toFixed(2);
    case "colors":
      return (product.colors ?? []).join(", ");
    case "image_url":
      return product.image_url ?? "";
    case "purchase_link":
      return product.purchase_link ?? "";
    case "description":
      return product.description ?? "";
    case "category":
      return product.category ?? "";
  }
}
