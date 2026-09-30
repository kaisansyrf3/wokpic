"use client";

import { useEffect, useRef } from "react";

import { FADE_EASE } from "@/animations/easings";
import { Overlay } from "@/components/transition/Overlay";
import { PixelDissolve } from "@/components/transition/PixelDissolve";
import gsap from "@/lib/gsap";

type TransitionNodes = {
  overlay: HTMLDivElement | null;
  cloneLayer: HTMLDivElement | null;
  canvas: HTMLCanvasElement | null;
};

/**
 * Populated by the provider mounted in the root layout, so these layers survive
 * the `/` -> `/works/[slug]` -> `/` route changes and clones never unmount
 * mid-flight.
 */
const nodes: TransitionNodes = {
  overlay: null,
  cloneLayer: null,
  canvas: null,
};

export function getTransitionNodes(): TransitionNodes {
  return nodes;
}

/** Drives the dark veil without React state so animation code can call it. */
export function fadeOverlayTo(opacity: number, duration: number) {
  const overlay = nodes.overlay;
  if (!overlay) return;
  gsap.to(overlay, { opacity, duration, ease: FADE_EASE, overwrite: "auto" });
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    nodes.overlay = overlayRef.current;
    nodes.cloneLayer = cloneRef.current;
    nodes.canvas = canvasRef.current;

    return () => {
      nodes.overlay = null;
      nodes.cloneLayer = null;
      nodes.canvas = null;
    };
  }, []);

  return (
    <>
      {children}

      <div className="pointer-events-none fixed inset-0 z-90" aria-hidden>
        <Overlay ref={overlayRef} />
        <PixelDissolve ref={canvasRef} />
      </div>

      <div
        ref={cloneRef}
        data-transition-clone-layer
        className="pointer-events-none fixed inset-0 z-100 overflow-hidden"
        aria-hidden
      />
    </>
  );
}
