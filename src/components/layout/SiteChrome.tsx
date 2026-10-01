"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  const shell = (
    <div
      data-site-chrome
      className={isLanding ? "no-page-scroll relative" : "relative flex min-h-dvh flex-col"}
    >
      <Header />
      <main className={isLanding ? "relative h-full" : "relative flex-1 pt-20 md:pt-24"}>
        {children}
      </main>
      {!isLanding ? <Footer /> : null}
    </div>
  );

  return isLanding ? shell : <SmoothScroll>{shell}</SmoothScroll>;
}
