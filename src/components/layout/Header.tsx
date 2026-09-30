"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MobileMenu } from "@/components/layout/MobileMenu";
import { navLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <Link
          href="/"
          className="ui-label pointer-events-auto text-sm font-medium tracking-[0.3em] text-chalk"
          aria-label={`${siteConfig.name} — beranda`}
        >
          {siteConfig.wordmark}
        </Link>

        <nav className="pointer-events-auto hidden flex-1 justify-center md:flex">
          <Link
            href="/"
            className={cn(
              "ui-label py-1 text-ash transition-colors hover:text-chalk",
              pathname === "/" && "border-b border-chalk/60 text-chalk",
            )}
          >
            WORKS
          </Link>
        </nav>

        <nav className="pointer-events-auto hidden items-center gap-8 md:flex">
          {navLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "ui-label py-1 text-ash transition-colors hover:text-chalk",
                pathname === link.href && "border-b border-chalk/60 text-chalk",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="ui-label pointer-events-auto text-ash transition-colors hover:text-chalk md:hidden"
          aria-label="Buka menu"
          aria-expanded={menuOpen}
        >
          MENU
        </button>
      </header>

      <MobileMenu open={menuOpen} pathname={pathname} onClose={() => setMenuOpen(false)} />
    </>
  );
}
