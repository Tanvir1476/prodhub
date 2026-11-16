import { z } from "zod";

import { CATEGORIES } from "@/lib/constants";

/* ----------------------------- helpers ---------------------------------- */

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`);

const optionalText = (max: number) =>
  trimmed(max).transform((v) => (v === "" ? null : v)).nullable().optional();

export const urlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid URL starting with http:// or https://" }
  )
  .transform((v) => (v === "" ? null : v));

const nonNegativeNumber = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number.` })
    .min(0, `${label} cannot be negative.`)
    .finite(`${label} must be a valid number.`);

/** "Black, Navy ,olive" -> ["Black", "Navy", "olive"] (deduplicated, max 12) */
export function parseColors(input: unknown): string[] {
  if (Array.isArray(input)) {
    return dedupe(input.map((c) => String(c).trim()).filter(Boolean));
  }
  if (typeof input !== "string") return [];
  return dedupe(
    input
      .split(/[,\n]/)
      .map((c) => c.trim())
      .filter(Boolean)
  );
}

function dedupe(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (!seen.has(key) && item.length <= 40) {
      seen.add(key);
      out.push(item);
    }
  }
  return out.slice(0, 12);
}

export const colorsSchema = z.preprocess(parseColors, z.array(z.string().min(1).max(40)).max(12));

export const categorySchema = z
  .string()
  .trim()
  .max(60)
  .transform((v) => (v === "" || v === "none" ? null : v))
  .refine((v) => v === null || (CATEGORIES as readonly string[]).includes(v), {
    message: "Choose a category from the list.",
  })
  .nullable()
  .optional();

/* ------------------------------ product ---------------------------------- */

export const productSchema = z.object({
  name: trimmed(160).min(1, "Product name is required."),
  quantity: nonNegativeNumber("Quantity").int("Quantity must be a whole number."),
  price: nonNegativeNumber("Price"),
  colors: colorsSchema,
  category: categorySchema,
  description: optionalText(2000),
  purchase_link: urlSchema.nullable().optional(),
  submitter_name: optionalText(80),
});
export type ProductInput = z.infer<typeof productSchema>;

/* --------------------------- change request ------------------------------ */

export const CHANGE_FIELDS = [
  "name",
  "quantity",
  "price",
  "colors",
  "image_url",
  "purchase_link",
  "description",
  "category",
] as const;

export const changeItemSchema = z
  .object({
    field: z.enum(CHANGE_FIELDS),
    current: z.string().trim().max(2048).default(""),
    proposed: z.string().trim().max(2048),
  })
  .superRefine((item, ctx) => {
    const { field, proposed } = item;
    const fail = (message: string) => ctx.addIssue({ code: "custom", message, path: ["proposed"] });

    switch (field) {
      case "name":
        if (!proposed) fail("Proposed name cannot be empty.");
        if (proposed.length > 160) fail("Name must be 160 characters or fewer.");
        break;
      case "quantity": {
        const n = Number(proposed);
        if (!Number.isInteger(n) || n < 0) fail("Quantity must be a non-negative whole number.");
        break;
      }
      case "price": {
        const n = Number(proposed);
        if (!Number.isFinite(n) || n < 0) fail("Price must be a non-negative number.");
        break;
      }
      case "purchase_link": {
        if (proposed) {
          const res = urlSchema.safeParse(proposed);
          if (!res.success) fail("Enter a valid URL starting with http:// or https://");
        }
        break;
      }
      case "category": {
        if (proposed && !(CATEGORIES as readonly string[]).includes(proposed)) fail("Choose a category from the list.");
        break;
      }
      case "image_url":
        // Filled in by the server after the upload succeeds.
        break;
      case "colors":
        if (parseColors(proposed).length === 0) fail("Enter at least one color.");
        break;
      case "description":
        if (proposed.length > 2000) fail("Description must be 2000 characters or fewer.");
        break;
    }
  });

export const changeRequestSchema = z.object({
  product_id: z.uuid("Invalid product."),
  reason: trimmed(2000).min(10, "Please explain the reason in at least 10 characters."),
  submitter_name: optionalText(80),
  changes: z.array(changeItemSchema).min(1, "Add at least one field to change.").max(8),
});
export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;

/* --------------------------- deletion request ---------------------------- */

export const deletionRequestSchema = z.object({
  product_id: z.uuid("Invalid product."),
  reason: trimmed(2000).min(10, "Please explain the reason in at least 10 characters."),
  additional_info: optionalText(2000),
  submitter_name: optionalText(80),
});
export type DeletionRequestInput = z.infer<typeof deletionRequestSchema>;

/* ------------------------------- review ---------------------------------- */

export const reviewSchema = z.object({
  id: z.uuid(),
  note: optionalText(1000),
});

/* ------------------------------- helpers --------------------------------- */

export function flattenErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export function firstError(fieldErrors: Record<string, string[]>): string {
  const first = Object.values(fieldErrors)[0];
  return first?.[0] ?? "Please check the form and try again.";
}

/** Reads FormData into a plain object (first value per key, arrays via name[]) */
export function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      if (Array.isArray(obj[k])) (obj[k] as string[]).push(value);
      else obj[k] = [value];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

/** Basic sanitisation: strip control characters & HTML tags from free text. */
export function sanitizeText(input: string | null | undefined): string | null {
  if (input == null) return null;
  const cleaned = input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  return cleaned === "" ? null : cleaned;
}
