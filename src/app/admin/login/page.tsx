import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/admin/login-form";
import { LogoMark } from "@/components/logo";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-primary/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-accent/40 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <LogoMark />
          <span className="text-lg font-bold">
            Prod<span className="text-violet-300">Hub</span> <span className="ml-1 text-sm font-medium text-slate-400">Admin</span>
          </span>
        </div>
        <div className="relative max-w-md">
          <ShieldCheck className="size-10 text-violet-300" />
          <h1 className="mt-6 text-3xl font-bold leading-tight">Keep the catalogue accurate and trustworthy.</h1>
          <p className="mt-4 text-slate-300">
            Review community submissions, approve change and removal requests, and manage every product from one secure dashboard.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">Restricted area · authorized Admin only</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> Back to website
          </Link>
          <div className="mt-8 flex items-center gap-3 lg:hidden">
            <LogoMark />
            <span className="text-lg font-bold">
              Prod<span className="text-primary">Hub</span> Admin
            </span>
          </div>
          <h2 className="mt-8 text-2xl font-bold tracking-tight">Admin Login</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with the authorized Admin account.</p>

          {reason === "unauthorized" && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Your session has expired or this account is not the Admin. Please sign in again.
            </p>
          )}

          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
