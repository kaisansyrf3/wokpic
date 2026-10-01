"use client";

import Link from "next/link";

import { MOBILE_BREAKPOINT } from "@/lib/viewport";
import type { ViewerFrameRect } from "@/lib/viewerFrame";

const ARROW_WIDTH = 44;
const ARROW_HEIGHT = 56;
/** Desktop arrows sit this far outside the photo… */
const SIDE_GAP = 24;
/** …but never closer than this to the edge of the screen. */
const EDGE_MIN = 12;
/** On a phone there is no room outside, so they ride on top of the photo. */
const OVERLAP_INSET = 12;

type ViewerControlsProps = {
  frame: ViewerFrameRect;
  viewportWidth: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onContact: () => void;
};

export function ViewerControls({
  frame,
  viewportWidth,
  onPrev,
  onNext,
  onClose,
  onContact,
}: ViewerControlsProps) {
  const sideSpace = frame.left;
  const outside =
    viewportWidth >= MOBILE_BREAKPOINT && sideSpace >= SIDE_GAP + ARROW_WIDTH + EDGE_MIN;

  const arrowInset = outside ? sideSpace - SIDE_GAP - ARROW_WIDTH : frame.left + OVERLAP_INSET;
  const arrowStyle = {
    width: ARROW_WIDTH,
    height: ARROW_HEIGHT,
    top: frame.top + frame.height / 2,
    transform: "translateY(-50%)",
  };

  const arrowSurface = outside
    ? "text-chalk/80 hover:text-chalk"
    : "bg-black/55 text-chalk backdrop-blur-[2px] hover:bg-black/70";

  return (
    <div
      data-viewer-controls
      className="pointer-events-none absolute inset-0 z-20"
      style={{ opacity: 0 }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="pointer-events-auto absolute flex h-11 w-11 items-center justify-center text-lg text-chalk/80 transition-colors hover:text-chalk"
        style={{
          left: "calc(24px + env(safe-area-inset-left))",
          top: "calc(24px + env(safe-area-inset-top))",
        }}
      >
        &#10005;
      </button>

      <button
        type="button"
        onClick={onPrev}
        aria-label="Foto sebelumnya"
        className={`pointer-events-auto absolute flex items-center justify-center text-2xl transition-colors ${arrowSurface}`}
        style={{ ...arrowStyle, left: arrowInset }}
      >
        &#8249;
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label="Foto berikutnya"
        className={`pointer-events-auto absolute flex items-center justify-center text-2xl transition-colors ${arrowSurface}`}
        style={{ ...arrowStyle, right: arrowInset }}
      >
        &#8250;
      </button>

      <Link
        href="/service"
        prefetch={false}
        onClick={(event) => {
          event.preventDefault();
          onContact();
        }}
        className="ui-label pointer-events-auto absolute left-1/2 flex min-h-11 -translate-x-1/2 items-center border border-line bg-ink/60 px-7 text-chalk transition-colors hover:border-chalk"
        style={{ bottom: "calc(28px + env(safe-area-inset-bottom))" }}
      >
        Hubungi Kami
      </Link>
    </div>
  );
}
