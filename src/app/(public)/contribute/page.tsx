import type { Metadata } from "next";
import { CheckCircle2, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { ProductForm } from "@/components/forms/product-form";
import { PageIntro } from "@/components/public/page-intro";
import { submitProductContribution } from "@/lib/actions/public";

export const metadata: Metadata = {
  title: "Add a Product",
  description: "Contribute a new product to the community catalogue. Submissions are reviewed by the Admin before publishing.",
};

export default function ContributePage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <PageIntro
        eyebrow="Contribute"
        title="Add a Product"
        text="Know a product that's missing from the catalogue? Fill in what you know — the Admin will review your submission before it goes live."
        back={{ href: "/products", label: "Back to products" }}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <ProductForm mode="contribute" action={submitProductContribution} successHref="/contribute/thank-you" />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary" /> Tips for a great listing
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              {[
                "Use the full product name as printed on the packaging.",
                "A clear photo on a plain background gets approved faster.",
                "Enter the regular retail price, not a temporary discount.",
                "Add the official store link if you have one.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-indigo-900">
              <ShieldCheck className="size-4" /> What happens next
            </h2>
            <ol className="mt-3 space-y-2.5 text-sm text-indigo-900/80">
              <li className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" /> Your submission is marked <strong className="mx-1">Pending Review</strong>.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" /> The Admin checks the details for accuracy.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Once approved it is published for everyone.
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
