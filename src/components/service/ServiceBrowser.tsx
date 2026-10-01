"use client";

import { useEffect, useRef, useState } from "react";

import { ServiceCard, type ServiceCardData } from "@/components/service/ServiceCard";
import { FADE_EASE, TAB_ENTER_DURATION, TAB_EXIT_DURATION } from "@/animations/easings";
import gsap from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string };

type ServiceBrowserProps = {
  categories: Category[];
  services: ServiceCardData[];
  serviceIdsByCategory: Record<string, string[]>;
  initialCategory: string;
};

/**
 * Category tabs for `/service`. All packages arrive from the server component, so
 * switching a tab never refetches or reloads; only the URL hint changes.
 */
export function ServiceBrowser({
  categories,
  services,
  serviceIdsByCategory,
  initialCategory,
}: ServiceBrowserProps) {
  const [active, setActive] = useState(initialCategory);
  const [shown, setShown] = useState(initialCategory);

  const panelRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<gsap.core.Tween | null>(null);
  const enterRef = useRef<gsap.core.Tween | null>(null);

  const byId = new Map(services.map((service) => [service.id, service]));
  const listed = (serviceIdsByCategory[shown] ?? [])
    .map((id) => byId.get(id))
    .filter((service): service is ServiceCardData => Boolean(service));
  const shownName = categories.find((category) => category.slug === shown)?.name ?? "ini";

  useEffect(
    () => () => {
      exitRef.current?.kill();
      enterRef.current?.kill();
    },
    [],
  );

  // Entering a tab: cards fade in and rise slightly, staggered.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    gsap.set(panel, { opacity: 1 });
    const targets = panel.querySelectorAll("[data-card], [data-empty]");
    if (targets.length === 0) return;

    const enter = gsap.from(targets, {
      opacity: 0,
      y: 14,
      duration: TAB_ENTER_DURATION,
      ease: FADE_EASE,
      stagger: 0.05,
      overwrite: true,
    });
    enterRef.current = enter;

    return () => {
      enter.kill();
    };
  }, [shown]);

  const writeUrl = (slug: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("category", slug);
    window.history.replaceState(window.history.state, "", url.toString());
  };

  const select = (slug: string) => {
    if (slug === active) return;
    setActive(slug);
    writeUrl(slug);

    // Coming back to the painted tab cancels a fade that is still running.
    if (slug === shown) {
      exitRef.current?.kill();
      exitRef.current = null;
      gsap.set(panelRef.current, { opacity: 1 });
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      setShown(slug);
      return;
    }

    exitRef.current?.kill();
    exitRef.current = gsap.to(panel, {
      opacity: 0,
      duration: TAB_EXIT_DURATION,
      ease: FADE_EASE,
      overwrite: true,
      onComplete: () => {
        exitRef.current = null;
        setShown(slug);
      },
    });
  };

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label="Kategori paket"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {categories.map((category) => {
          const isActive = category.slug === active;
          return (
            <button
              key={category.slug}
              type="button"
              role="tab"
              id={`category-tab-${category.slug}`}
              aria-selected={isActive}
              aria-controls="category-panel"
              onClick={() => select(category.slug)}
              className={cn(
                "ui-label flex min-h-11 shrink-0 cursor-pointer items-center border-b-2 px-4 whitespace-nowrap transition-colors",
                isActive
                  ? "border-chalk text-chalk"
                  : "border-transparent text-ash hover:text-chalk",
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      <div
        ref={panelRef}
        id="category-panel"
        role="tabpanel"
        aria-labelledby={`category-tab-${shown}`}
      >
        {listed.length === 0 ? (
          <p
            data-empty
            className="border border-line bg-ink-soft/40 px-6 py-14 text-center text-sm text-ash"
          >
            Paket untuk kategori {shownName} sedang disiapkan. Silakan hubungi kami lewat formulir
            Contact untuk penawaran khusus.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} categorySlug={shown} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
