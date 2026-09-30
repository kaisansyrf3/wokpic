"use client";

import { useEffect, useRef } from "react";

import { pageReveal } from "@/animations/pageReveal";
import gsap from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Marks up a server-rendered block and animates its `[data-reveal]` children in.
 * The content is already in the HTML; this only plays the entrance.
 */
export function Reveal({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => pageReveal(root), root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className={cn(className)}>
      {children}
    </div>
  );
}
