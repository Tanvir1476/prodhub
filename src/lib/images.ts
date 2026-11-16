import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";

export const IMAGE_BUCKET = "product-images";

type ValidationResult = { ok: true; ext: string; mime: string } | { ok: false; error: string };

/**
 * Validates an uploaded image by size, declared MIME type and — crucially —
 * by sniffing the file's magic bytes so a renamed executable can't slip through.
 */
export async function validateImage(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "The selected file is empty." };
  if (file.size > MAX_IMAGE_BYTES)
    return { ok: false, error: `Image must be ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB or smaller.` };

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type))
    return { ok: false, error: "Only JPG, JPEG, PNG and WEBP images are allowed." };

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const sniffed = sniffImageType(head);
  if (!sniffed) return { ok: false, error: "The file does not look like a valid JPG, PNG or WEBP image." };

  return { ok: true, ext: sniffed.ext, mime: sniffed.mime };
}

function sniffImageType(b: Uint8Array): { ext: string; mime: string } | null {
  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return { ext: "png", mime: "image/png" };
  // WEBP: "RIFF" .... "WEBP"
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return { ext: "webp", mime: "image/webp" };
  return null;
}

/**
 * Uploads a validated image to Supabase Storage and returns its public URL.
 * `folder` separates visitor uploads from admin uploads for easy clean-up.
 */
export async function uploadImage(
  supabase: SupabaseClient,
  file: File,
  folder: "products" | "submissions" | "evidence"
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  const validation = await validateImage(file);
  if (!validation.ok) return validation;

  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${validation.ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, {
    contentType: validation.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { ok: false, error: "Image upload failed. Please try again." };

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

/** Best-effort removal of an image we previously uploaded (ignores failures). */
export async function removeImageByUrl(supabase: SupabaseClient, url: string | null | undefined) {
  if (!url) return;
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length));
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

/** Returns the file from FormData only if the user actually picked one. */
export function getOptionalFile(formData: FormData, key: string): File | null {
  const f = formData.get(key);
  if (f instanceof File && f.size > 0 && f.name) return f;
  return null;
}
