"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAdmin } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await signInAdmin(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          toast.success("Welcome back, Admin.");
          router.replace(result.data?.next ?? "/admin");
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Email address" htmlFor="login-email" required>
        <Input id="login-email" name="email" type="email" autoComplete="email" placeholder="admin@yourdomain.com" required />
      </Field>

      <Field label="Password" htmlFor="login-password" required error={error ?? undefined}>
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            required
            className="pr-10"
            aria-invalid={Boolean(error)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {!pending && <LogIn />} Sign in to Dashboard
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Credentials are verified by Supabase Auth. Repeated failed attempts are rate-limited.
      </p>
    </form>
  );
}
