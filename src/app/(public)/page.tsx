import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Compass,
  PackageCheck,
  PencilLine,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import { SearchBar } from "@/components/public/search-bar";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/constants";
import { getPublicStats, getRecentProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<FeaturedSkeleton />}>
        <Featured />
      </Suspense>
      <HowItWorks />
      <CallToAction />
    </>
  );
}

/* --------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" aria-hidden />

      <div className="container-x relative pb-16 pt-14 sm:pb-24 sm:pt-20 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center stagger">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            Community-powered product catalogue
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Discover, Share &amp; Manage{" "}
            <span className="text-gradient">Products Together.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            {SITE_DESCRIPTION}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="gradient" className="w-full sm:w-auto" asChild>
              <Link href="/products">
                <Compass /> Explore Products
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/contribute">
                <PlusCircle /> Contribute a Product
              </Link>
            </Button>
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <SearchBar />
            <p className="mt-3 text-xs text-muted-foreground">
              Try searching for <Link href="/products?q=headphones" className="font-medium text-primary hover:underline">headphones</Link>,{" "}
              <Link href="/products?q=chair" className="font-medium text-primary hover:underline">chair</Link> or{" "}
              <Link href="/products?q=bottle" className="font-medium text-primary hover:underline">bottle</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- stats ---------------------------------- */

async function Stats() {
  const stats = await getPublicStats();
  const items = [
    { label: "Total products", value: stats.total_products, Icon: Boxes, tone: "text-primary bg-primary/10" },
    { label: "Available right now", value: stats.available_products, Icon: PackageCheck, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Community contributions", value: stats.community_contributions, Icon: Users, tone: "text-violet-600 bg-violet-50" },
  ];
  return (
    <section id="stats" className="container-x -mt-2">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ label, value, Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-6" />
            </span>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">{value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="container-x -mt-2">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-2xl border border-border bg-slate-100" />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- featured -------------------------------- */

async function Featured() {
  const products = await getRecentProducts(8);
  return (
    <section className="container-x mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Fresh from the community</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Recently added products</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            The newest listings approved by the Admin. Spot something inaccurate? Suggest an edit directly from any card.
          </p>
        </div>
        <Button variant="ghost" className="self-start sm:self-auto" asChild>
          <Link href="/products">
            View all products <ArrowRight />
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Boxes className="size-7" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Be the first to contribute. Your submission will be reviewed by the Admin before it goes live.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/contribute">
              <PlusCircle /> Add a Product
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <section className="container-x mt-20">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200/70" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ how it works ----------------------------- */

const STEPS = [
  {
    Icon: Search,
    title: "Explore the catalogue",
    text: "Browse products, filter by category, color or price, and open any listing for full details — no account needed.",
  },
  {
    Icon: PencilLine,
    title: "Contribute & suggest",
    text: "Add a new product, request a change to an existing one, or ask for an outdated listing to be removed.",
  },
  {
    Icon: ShieldCheck,
    title: "Admin reviews",
    text: "Every contribution lands in a review queue. Nothing changes publicly until the Admin approves it.",
  },
  {
    Icon: BadgeCheck,
    title: "Catalogue stays accurate",
    text: "Approved updates go live instantly and every decision is recorded in a transparent request history.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="container-x mt-24 scroll-mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Open contribution, controlled publishing</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Anyone can help keep product information accurate. A single Admin keeps the catalogue trustworthy.
        </p>
      </div>

      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title} className="relative rounded-2xl border border-border bg-card p-6 shadow-soft card-hover">
            <span className="absolute right-5 top-5 text-4xl font-black text-slate-100">0{i + 1}</span>
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/20">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* --------------------------------- CTA ----------------------------------- */

function CallToAction() {
  return (
    <section className="container-x mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center text-white shadow-xl sm:px-12">
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-primary/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-accent/40 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">{SITE_TAGLINE}</h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Know a product that&apos;s missing, or spotted a wrong price? It only takes a minute to put it right.
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            {["No account required", "Reviewed by the Admin", "Changes tracked transparently"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/contribute">
                <PlusCircle /> Add a Product
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="/products">Explore Products</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
