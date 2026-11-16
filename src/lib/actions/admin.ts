"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { getOptionalFile, removeImageByUrl, uploadImage } from "@/lib/images";
import { getProduct } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { firstError, flattenErrors, formToObject, productSchema, reviewSchema, sanitizeText } from "@/lib/validation";

/* ------------------------------------------------------------------------ */
/* Every action below:                                                       */
/*   1. verifies the Admin session (requireAdmin)                            */
/*   2. uses the Admin's own Supabase client, so RLS is enforced as well     */
/*   3. revalidates the affected pages                                       */
/* ------------------------------------------------------------------------ */

function revalidateCatalogue(productId?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  if (productId) revalidatePath(`/products/${productId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/history");
}

function revalidateReviews() {
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/change-requests");
  revalidatePath("/admin/deletion-requests");
  revalidatePath("/admin/history");
}

async function logAction(action: string, targetType: string, targetId: string | null, details: Record<string, unknown> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_admin_action", {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_details: details,
  });
}

/* ---------------------------- authentication ----------------------------- */

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------- products -------------------------------- */

export async function createProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const fieldErrors = flattenErrors(parsed.error);
    return { ok: false, error: firstError(fieldErrors), fieldErrors };
  }
  const input = parsed.data;
  const supabase = await createClient();

  let image_url: string | null = null;
  const file = getOptionalFile(formData, "image");
  if (file) {
    const up = await uploadImage(supabase, file, "products");
    if (!up.ok) return { ok: false, error: up.error, fieldErrors: { image: [up.error] } };
    image_url = up.url;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      quantity: input.quantity,
      price: input.price,
      colors: input.colors,
      category: input.category ?? null,
      description: sanitizeText(input.description),
      purchase_link: input.purchase_link ?? null,
      image_url,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await logAction("product.created", "product", data.id, { name: input.name });
  revalidateCatalogue(data.id);
  return { ok: true, data: { id: data.id }, message: "Product published successfully." };
}

export async function updateProduct(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const existing = await getProduct(id);
  if (!existing) return { ok: false, error: "Product not found." };

  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const fieldErrors = flattenErrors(parsed.error);
    return { ok: false, error: firstError(fieldErrors), fieldErrors };
  }
  const input = parsed.data;
  const supabase = await createClient();

  let image_url = existing.image_url;
  const removeImage = formData.get("remove_image") === "true";
  const file = getOptionalFile(formData, "image");
  if (file) {
    const up = await uploadImage(supabase, file, "products");
    if (!up.ok) return { ok: false, error: up.error, fieldErrors: { image: [up.error] } };
    image_url = up.url;
  } else if (removeImage) {
    image_url = null;
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      quantity: input.quantity,
      price: input.price,
      colors: input.colors,
      category: input.category ?? null,
      description: sanitizeText(input.description),
      purchase_link: input.purchase_link ?? null,
      image_url,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  if ((file || removeImage) && existing.image_url && existing.image_url !== image_url) {
    await removeImageByUrl(supabase, existing.image_url);
  }

  await logAction("product.updated", "product", id, { name: input.name });
  revalidateCatalogue(id);
  return { ok: true, message: "Product updated." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const existing = await getProduct(id);
  if (!existing) return { ok: false, error: "Product not found." };

  const supabase = await createClient();
  // Log first (so the product name survives the delete), then delete.
  await logAction("product.deleted", "product", id, {
    name: existing.name,
    price: existing.price,
    quantity: existing.quantity,
    permanent: true,
  });
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await removeImageByUrl(supabase, existing.image_url);
  revalidateCatalogue(id);
  return { ok: true, message: `"${existing.name}" was permanently deleted.` };
}

export async function setProductArchived(id: string, archived: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_archived: archived, archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .select("name")
    .single();
  if (error) return { ok: false, error: error.message };

  await logAction(archived ? "product.archived" : "product.restored", "product", id, { name: data.name });
  revalidateCatalogue(id);
  return { ok: true, message: archived ? `"${data.name}" archived and hidden from visitors.` : `"${data.name}" is live again.` };
}

/* ------------------------------ submissions ------------------------------ */

type ReviewKind = "submission" | "change_request" | "deletion_request";
type ReviewDecision = "approve" | "reject";

const RPC: Record<ReviewKind, Record<ReviewDecision, string>> = {
  submission: { approve: "approve_submission", reject: "reject_submission" },
  change_request: { approve: "approve_change_request", reject: "reject_change_request" },
  deletion_request: { approve: "approve_deletion_request", reject: "reject_deletion_request" },
};

const PARAM: Record<ReviewKind, string> = {
  submission: "p_submission_id",
  change_request: "p_request_id",
  deletion_request: "p_request_id",
};

const SUCCESS: Record<ReviewKind, Record<ReviewDecision, string>> = {
  submission: { approve: "Submission approved and published.", reject: "Submission rejected." },
  change_request: { approve: "Change request approved and applied to the product.", reject: "Change request rejected." },
  deletion_request: { approve: "Deletion request approved. The product has been archived.", reject: "Deletion request rejected." },
};

/**
 * Runs one of the transactional review functions in Postgres. Each function
 * re-checks is_admin() inside the database, applies the change and writes the
 * audit log in a single transaction.
 */
export async function reviewRequest(
  kind: ReviewKind,
  decision: ReviewDecision,
  payload: { id: string; note?: string | null }
): Promise<ActionResult<{ productId?: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { id, note } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(RPC[kind][decision], {
    [PARAM[kind]]: id,
    p_note: sanitizeText(note),
  });

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidateReviews();
  revalidateCatalogue(typeof data === "string" ? data : undefined);
  return { ok: true, data: { productId: typeof data === "string" ? data : undefined }, message: SUCCESS[kind][decision] };
}

function friendlyDbError(message: string) {
  if (/already been reviewed/i.test(message)) return "This request has already been reviewed.";
  if (/not authorized/i.test(message)) return "You are not authorized to perform this action.";
  if (/no longer exists/i.test(message)) return "The related product no longer exists.";
  if (/invalid input syntax/i.test(message)) return "The proposed value is not valid for this field. Edit the product manually instead.";
  return message;
}
