"use server";

import { revalidatePath } from "next/cache";

import { MESSAGES } from "@/lib/constants";
import { getOptionalFile, uploadImage } from "@/lib/images";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { getProduct } from "@/lib/queries";
import type { ActionResult, RequestedChanges } from "@/lib/types";
import {
  changeRequestSchema,
  deletionRequestSchema,
  firstError,
  flattenErrors,
  formToObject,
  parseColors,
  productSchema,
  sanitizeText,
} from "@/lib/validation";

/* ------------------------------------------------------------------------ */
/* Visitors never write to the database directly. Every public mutation runs */
/* here on the server: rate-limited → validated → sanitised → inserted with  */
/* the service-role key as a *pending* record for the Admin to review.       */
/* ------------------------------------------------------------------------ */

const HONEYPOT_FIELD = "website_url_confirm";

function botCheck(formData: FormData): string | null {
  const honey = formData.get(HONEYPOT_FIELD);
  if (typeof honey === "string" && honey.trim() !== "") return "Submission could not be processed.";
  return null;
}

/** Visitor: propose a brand-new product */
export async function submitProductContribution(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const bot = botCheck(formData);
  if (bot) return { ok: false, error: bot };

  const rl = await checkRateLimit({ scope: "submission", limit: 5, windowSeconds: 60 * 60 });
  if (!rl.ok) return { ok: false, error: rl.error };

  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const fieldErrors = flattenErrors(parsed.error);
    return { ok: false, error: firstError(fieldErrors), fieldErrors };
  }
  const input = parsed.data;
  const supabase = createServiceClient();

  let image_url: string | null = null;
  const file = getOptionalFile(formData, "image");
  if (file) {
    const up = await uploadImage(supabase, file, "submissions");
    if (!up.ok) return { ok: false, error: up.error, fieldErrors: { image: [up.error] } };
    image_url = up.url;
  }

  const { data, error } = await supabase
    .from("product_submissions")
    .insert({
      name: sanitizeText(input.name) ?? input.name,
      quantity: input.quantity,
      price: input.price,
      colors: input.colors,
      category: input.category ?? null,
      description: sanitizeText(input.description),
      purchase_link: input.purchase_link ?? null,
      submitter_name: sanitizeText(input.submitter_name),
      image_url,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitProductContribution]", error.message);
    return { ok: false, error: "We couldn't save your submission right now. Please try again in a moment." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  return { ok: true, data: { id: data.id }, message: MESSAGES.submissionReceived };
}

/** Visitor: request one or more field changes on an existing product */
export async function submitChangeRequest(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const bot = botCheck(formData);
  if (bot) return { ok: false, error: bot };

  const rl = await checkRateLimit({ scope: "change-request", limit: 10, windowSeconds: 60 * 60 });
  if (!rl.ok) return { ok: false, error: rl.error };

  // Changes arrive as changes[i][field], changes[i][current], changes[i][proposed]
  const changes: { field: string; current: string; proposed: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const field = formData.get(`changes[${i}][field]`);
    if (typeof field !== "string" || !field) continue;
    changes.push({
      field,
      current: String(formData.get(`changes[${i}][current]`) ?? ""),
      proposed: String(formData.get(`changes[${i}][proposed]`) ?? ""),
    });
  }

  const parsed = changeRequestSchema.safeParse({
    product_id: formData.get("product_id"),
    reason: formData.get("reason"),
    submitter_name: formData.get("submitter_name"),
    changes,
  });
  if (!parsed.success) {
    const fieldErrors = flattenErrors(parsed.error);
    return { ok: false, error: firstError(fieldErrors), fieldErrors };
  }
  const input = parsed.data;

  const product = await getProduct(input.product_id);
  if (!product || product.is_archived) return { ok: false, error: "This product is no longer available." };

  const supabase = createServiceClient();

  // Optional image for an "image_url" change — uploaded now, URL stored as the proposal.
  const requested: RequestedChanges = {};
  const seen = new Set<string>();
  for (const change of input.changes) {
    if (seen.has(change.field)) return { ok: false, error: `"${change.field}" was listed more than once.` };
    seen.add(change.field);

    let proposed = change.proposed;
    if (change.field === "image_url") {
      const file = getOptionalFile(formData, "new_image");
      if (!file) return { ok: false, error: "Please choose the new product image to upload.", fieldErrors: { new_image: ["Image required."] } };
      const up = await uploadImage(supabase, file, "submissions");
      if (!up.ok) return { ok: false, error: up.error, fieldErrors: { new_image: [up.error] } };
      proposed = up.url;
    } else if (change.field === "colors") {
      proposed = parseColors(change.proposed).join(", ");
    } else if (change.field === "quantity") {
      proposed = String(Math.round(Number(change.proposed)));
    } else if (change.field === "price") {
      proposed = Number(change.proposed).toFixed(2);
    } else {
      proposed = sanitizeText(change.proposed) ?? "";
    }

    requested[change.field] = {
      current: currentValueOf(product, change.field),
      proposed,
    };
  }

  let evidence_url: string | null = null;
  const evidence = getOptionalFile(formData, "evidence");
  if (evidence) {
    const up = await uploadImage(supabase, evidence, "evidence");
    if (!up.ok) return { ok: false, error: up.error, fieldErrors: { evidence: [up.error] } };
    evidence_url = up.url;
  }

  const { data, error } = await supabase
    .from("change_requests")
    .insert({
      product_id: product.id,
      requested_changes: requested,
      reason: sanitizeText(input.reason) ?? input.reason,
      evidence_url,
      submitter_name: sanitizeText(input.submitter_name),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitChangeRequest]", error.message);
    return { ok: false, error: "We couldn't save your request right now. Please try again in a moment." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/change-requests");
  return { ok: true, data: { id: data.id }, message: MESSAGES.changeRequestReceived };
}

/** Visitor: request that a product be removed */
export async function submitDeletionRequest(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const bot = botCheck(formData);
  if (bot) return { ok: false, error: bot };

  const rl = await checkRateLimit({ scope: "deletion-request", limit: 10, windowSeconds: 60 * 60 });
  if (!rl.ok) return { ok: false, error: rl.error };

  const parsed = deletionRequestSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const fieldErrors = flattenErrors(parsed.error);
    return { ok: false, error: firstError(fieldErrors), fieldErrors };
  }
  const input = parsed.data;

  const product = await getProduct(input.product_id);
  if (!product || product.is_archived) return { ok: false, error: "This product is no longer available." };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("deletion_requests")
    .insert({
      product_id: product.id,
      reason: sanitizeText(input.reason) ?? input.reason,
      additional_info: sanitizeText(input.additional_info),
      submitter_name: sanitizeText(input.submitter_name),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitDeletionRequest]", error.message);
    return { ok: false, error: "We couldn't save your request right now. Please try again in a moment." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/deletion-requests");
  return { ok: true, data: { id: data.id }, message: MESSAGES.deletionRequestReceived };
}

/* ------------------------------- helpers --------------------------------- */

function currentValueOf(product: Awaited<ReturnType<typeof getProduct>>, field: string): string {
  if (!product) return "";
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
    default:
      return "";
  }
}
