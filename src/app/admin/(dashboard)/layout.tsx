import type { Metadata } from "next";

import { AdminMobileNav, AdminSidebar } from "@/components/admin/sidebar";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard", template: "%s · ProdHub Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const counts = await getPendingCounts();

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar counts={counts} email={session.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/85 px-4 backdrop-blur-xl lg:hidden">
          <AdminMobileNav counts={counts} email={session.email} />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

async function getPendingCounts() {
  const supabase = await createClient();
  const pending = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "pending");
  const [s, c, d] = await Promise.all([pending("product_submissions"), pending("change_requests"), pending("deletion_requests")]);
  return { submissions: s.count ?? 0, changes: c.count ?? 0, deletions: d.count ?? 0 };
}
