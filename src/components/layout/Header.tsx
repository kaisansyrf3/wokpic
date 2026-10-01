"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MobileMenu } from "@/components/layout/MobileMenu";
import { navLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const isLanding = pathname === "/";

  return (
    <>
      {/* Scrolled pages need a scrim under the header bar: the logo would otherwise sit on
          top of text. z-30 keeps it above page content and below the header itself (z-40),
          and the landing page never scrolls, so the ring keeps its clean backdrop. */}
      {isLanding ? null : (
        <span
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-28 bg-gradient-to-b from-ink via-ink/95 to-transparent"
        />
      )}

      <header
        data-site-header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7"
      >
        <Link
          href="/"
          className="pointer-events-auto flex h-6 items-center md:h-[clamp(24px,2.2vw,36px)]"
          aria-label={`Beranda ${siteConfig.name}`}
        >
          {logoFailed ? (
            <span className="text-sm font-light uppercase tracking-[0.3em] text-chalk md:text-base">
              {siteConfig.name}
            </span>
          ) : (
            <Image
              src={siteConfig.logo.src}
              alt={siteConfig.logo.alt}
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
              sizes="(max-width: 767px) 52px, 78px"
              priority
              draggable={false}
              onError={() => setLogoFailed(true)}
              className="h-full w-auto"
            />
          )}
        </Link>

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
          className="ui-label tap-target pointer-events-auto text-ash transition-colors hover:text-chalk md:hidden"
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
