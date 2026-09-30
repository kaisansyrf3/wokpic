import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin/AdminNav";
import { siteConfig } from "@/config/site";
import { requireAdminUser } from "@/lib/auth";
import { countUnreadMessages } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = {
  title: `Admin - ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, unread] = await Promise.all([requireAdminUser(), countUnreadMessages()]);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line p-5 md:h-dvh md:w-60 md:border-b-0 md:border-r md:p-6">
        <Link href="/admin" className="ui-label text-chalk">
          {siteConfig.name} · Admin
        </Link>

        <div className="-mx-1 overflow-x-auto md:mx-0 md:overflow-visible">
          <AdminNav unreadCount={unread} />
        </div>

        <p className="hidden truncate text-xs text-ash md:block">{user.email}</p>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
