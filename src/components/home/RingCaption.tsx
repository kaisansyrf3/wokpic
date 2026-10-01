"use client";

import { useTransitionStore } from "@/store/transition";
import { pad3 } from "@/lib/utils";

/**
 * The landing footer bar: the slot number on the left, the fixed section label
 * in the middle, and nothing on the right. It is faded in and out together with
 * the ring by `RingGallery`, which owns the only animation that touches it.
 */
export function RingCaption() {
  const topIndex = useTransitionStore((state) => state.topIndex);

  return (
    <div
      data-ring-caption
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7"
      style={{ opacity: 0 }}
    >
      <span className="ui-label text-ash tabular-nums">{pad3(topIndex + 1)}</span>

      <span className="ui-label absolute left-1/2 -translate-x-1/2 text-chalk">
        OUR PORTOFOLIO
      </span>
    </div>
  );
}
