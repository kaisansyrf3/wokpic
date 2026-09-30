"use client";

type PixelDissolveProps = {
  ref?: React.Ref<HTMLCanvasElement>;
};

/**
 * Single full-screen canvas the photo is shattered into pixel particles on.
 * Kept in the root-level transition layer so it survives the route change back
 * to the landing page.
 */
export function PixelDissolve({ ref }: PixelDissolveProps) {
  return (
    <canvas
      ref={ref}
      data-transition-canvas
      className="absolute inset-0 h-full w-full opacity-0"
    />
  );
}
