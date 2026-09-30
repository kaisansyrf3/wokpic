"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import type { SocialLink } from "@/types/database";

type SiteChromeProps = {
  socialLinks: SocialLink[];
  children: React.ReactNode;
};

export function SiteChrome({ socialLinks, children }: SiteChromeProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  const shell = (
    <div
      data-site-chrome
      className={
        isLanding
          ? "dot-field no-page-scroll relative"
          : "dot-field relative flex min-h-dvh flex-col"
      }
    >
      <Header />
      <main className={isLanding ? "h-full" : "flex-1 pt-20 md:pt-24"}>
        {children}
      </main>
      {!isLanding ? <Footer socialLinks={socialLinks} /> : null}
    </div>
  );

  return isLanding ? shell : <SmoothScroll>{shell}</SmoothScroll>;
}
