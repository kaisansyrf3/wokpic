"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/services", label: "Paket" },
  { href: "/admin/messages", label: "Pesan", badge: "unread" as const },
  { href: "/admin/about", label: "About" },
];

export function AdminNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-row gap-1 md:flex-col">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "ui-label flex shrink-0 items-center justify-between gap-3 px-3 py-2 text-ash hover:text-chalk",
                active ? "text-chalk md:border-l md:border-chalk" : "md:border-l md:border-transparent",
              )}
            >
              {link.label}
              {link.badge === "unread" && unreadCount > 0 ? (
                <span className="rounded-full bg-chalk px-1.5 py-0.5 text-[10px] font-medium tracking-normal text-ink">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="mt-auto">
        <button type="submit" className="admin-button w-full">
          Keluar
        </button>
      </form>
    </div>
  );
}
