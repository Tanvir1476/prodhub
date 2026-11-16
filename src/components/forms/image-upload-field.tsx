"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  name: string;
  label?: string;
  hint?: string;
  /** Existing image to show (edit mode) */
  initialUrl?: string | null;
  /** Hidden-input name that becomes "true" when the user removes the existing image */
  removeFlagName?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function ImageUploadField({
  name,
  label = "Product image",
  hint = "JPG, JPEG, PNG or WEBP · up to 5 MB",
  initialUrl,
  removeFlagName,
  error,
  required,
  className,
}: ImageUploadFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [isNewFile, setIsNewFile] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (isNewFile && preview) URL.revokeObjectURL(preview);
    };
  }, [isNewFile, preview]);

  const applyFile = (file: File | undefined) => {
    setLocalError(null);
    if (!file) return;
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (!(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
      setLocalError("Only JPG, JPEG, PNG and WEBP images are allowed.");
      clear();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError("Image must be 5 MB or smaller.");
      clear();
      return;
    }
    if (isNewFile && preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setIsNewFile(true);
    setRemoved(false);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    if (isNewFile && preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setIsNewFile(false);
    setRemoved(Boolean(initialUrl));
  };

  const message = error ?? localError;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>

      {removeFlagName && <input type="hidden" name={removeFlagName} value={removed ? "true" : "false"} />}

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => applyFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-3">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image src={preview} alt="Image preview" fill unoptimized className="object-cover" />
          </div>
          <div className="min-w-0 flex-1 py-1">
            <p className="text-sm font-medium">{isNewFile ? "New image selected" : "Current image"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Preview shown before submission.</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <ImagePlus /> Replace
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-red-50 hover:text-destructive" onClick={clear}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && inputRef.current) {
              const dt = new DataTransfer();
              dt.items.add(file);
              inputRef.current.files = dt.files;
              applyFile(file);
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-slate-50/60 hover:border-primary/50 hover:bg-primary/5",
            message && "border-destructive/60"
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <UploadCloud className="size-5" />
          </span>
          <span className="text-sm font-medium">
            <span className="text-primary">Click to upload</span> or drag &amp; drop
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </label>
      )}

      {message && <p className="text-xs font-medium text-destructive">{message}</p>}
    </div>
  );
}
