"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, PlusCircle, Search, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Explore Products" },
  { href: "/contribute", label: "Add a Product" },
  { href: "/#how-it-works", label: "How It Works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-300",
        scrolled ? "border-border bg-white/85 shadow-soft backdrop-blur-xl" : "border-transparent bg-transparent"
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(item.href) && !item.href.includes("#")
                  ? "bg-primary/8 text-primary"
                  : "text-slate-600 hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" asChild aria-label="Search products">
            <Link href="/products?focus=search">
              <Search />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/login">
              <ShieldCheck /> Admin
            </Link>
          </Button>
          <Button asChild>
            <Link href="/contribute">
              <PlusCircle /> Add a Product
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" asChild aria-label="Search products">
            <Link href="/products?focus=search">
              <Search />
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] max-w-sm">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-2">
                <Logo />
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                      isActive(item.href) && !item.href.includes("#")
                        ? "bg-primary/8 text-primary"
                        : "text-slate-700 hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 flex flex-col gap-3">
                <Button size="lg" asChild>
                  <Link href="/contribute">
                    <PlusCircle /> Add a Product
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/admin/login">
                    <ShieldCheck /> Admin Login
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
