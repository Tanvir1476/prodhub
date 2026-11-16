"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  ExternalLink,
  FilePlus2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PencilRuler,
  Trash2,
} from "lucide-react";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOutAdmin } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export interface SidebarCounts {
  submissions: number;
  changes: number;
  deletions: number;
}

const NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/submissions", label: "Product Submissions", Icon: ClipboardList, countKey: "submissions" as const },
  { href: "/admin/change-requests", label: "Change Requests", Icon: PencilRuler, countKey: "changes" as const },
  { href: "/admin/deletion-requests", label: "Deletion Requests", Icon: Trash2, countKey: "deletions" as const },
  { href: "/admin/history", label: "Request History", Icon: History },
];

export function AdminSidebar({ counts, email }: { counts: SidebarCounts; email: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <SidebarInner counts={counts} email={email} />
    </aside>
  );
}

export function AdminMobileNav({ counts, email }: { counts: SidebarCounts; email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))?.label ?? "Admin";

  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open admin menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarInner counts={counts} email={email} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">{current}</span>
    </div>
  );
}

function SidebarInner({ counts, email, onNavigate }: { counts: SidebarCounts; email: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <LogoMark />
        <div>
          <p className="text-sm font-bold leading-tight text-white">
            Prod<span className="text-violet-300">Hub</span>
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, Icon, exact, countKey }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const count = countKey ? counts[countKey] : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/10 text-white shadow-inner" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("size-4.5", active ? "text-violet-300" : "text-slate-400")} />
              <span className="flex-1 truncate">{label}</span>
              {count > 0 && (
                <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold leading-none text-amber-950">{count}</span>
              )}
            </Link>
          );
        })}

        <div className="my-3 h-px bg-sidebar-border" />

        <Link
          href="/admin/products/new"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <FilePlus2 className="size-4.5 text-slate-400" /> Add Product
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-4.5 text-slate-400" /> View public site
        </Link>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
            {email.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Admin</p>
            <p className="truncate text-xs text-sidebar-muted">{email}</p>
          </div>
        </div>
        <form action={signOutAdmin} className="mt-3">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:bg-white/5 hover:text-white">
            <LogOut /> Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
