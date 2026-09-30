"use client";

import { useEffect, useRef } from "react";

type TransitionNodes = {
  cloneLayer: HTMLDivElement | null;
};

/**
 * Populated by the provider mounted in the root layout, so this layer survives
 * the `/` -> `/works/[slug]` -> `/` route changes and the shared-element clone
 * never unmounts mid-flight.
 */
const nodes: TransitionNodes = {
  cloneLayer: null,
};

export function getTransitionNodes(): TransitionNodes {
  return nodes;
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const cloneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nodes.cloneLayer = cloneRef.current;
    return () => {
      nodes.cloneLayer = null;
    };
  }, []);

  return (
    <>
      {children}

      <div
        ref={cloneRef}
        data-transition-clone-layer
        className="pointer-events-none fixed inset-0 z-100 overflow-hidden"
        aria-hidden
      />
    </>
  );
}
