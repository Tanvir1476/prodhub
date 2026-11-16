import Link from "next/link";

import { Logo } from "@/components/logo";
import { SITE_DESCRIPTION } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{SITE_DESCRIPTION}</p>
        </div>

        <FooterColumn
          title="Explore"
          links={[
            { href: "/products", label: "All products" },
            { href: "/products?sort=newest", label: "Recently added" },
            { href: "/products?inStock=1", label: "In stock now" },
          ]}
        />
        <FooterColumn
          title="Contribute"
          links={[
            { href: "/contribute", label: "Add a Product" },
            { href: "/products", label: "Request a Change" },
            { href: "/#how-it-works", label: "How it works" },
          ]}
        />
        <FooterColumn
          title="Platform"
          links={[
            { href: "/admin/login", label: "Admin Login" },
            { href: "/#stats", label: "Community stats" },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ProdHub. Community-maintained product information.</p>
          <p>Every contribution is reviewed by an Admin before it goes live.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
