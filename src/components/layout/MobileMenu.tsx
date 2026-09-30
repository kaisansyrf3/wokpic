"use client";

import Link from "next/link";
import { useEffect } from "react";

import { navLinks } from "@/config/site";
import { cn } from "@/lib/utils";

type MobileMenuProps = {
  open: boolean;
  pathname: string;
  onClose: () => void;
};

export function MobileMenu({ open, pathname, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-ink transition-opacity duration-300 md:hidden",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <span className="ui-label text-sm font-medium tracking-[0.3em]">MENU</span>
        <button
          type="button"
          onClick={onClose}
          className="ui-label text-ash transition-colors hover:text-chalk"
          aria-label="Tutup menu"
          tabIndex={open ? 0 : -1}
        >
          TUTUP
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-center gap-6 px-6">
        {navLinks.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className={cn(
              "text-3xl font-light uppercase tracking-[0.18em] transition-colors",
              pathname === link.href ? "text-chalk" : "text-ash hover:text-chalk",
            )}
          >
            <span className="ui-label mr-4 align-middle text-ash">
              {String(index + 1).padStart(2, "0")}
            </span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
