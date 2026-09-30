"use client";

import { useTransitionStore } from "@/store/transition";
import { pad3 } from "@/lib/utils";

type RingCaptionProps = {
  items: Array<{ title: string; category: string | null }>;
};

export function RingCaption({ items }: RingCaptionProps) {
  const topIndex = useTransitionStore((state) => state.topIndex);
  const phase = useTransitionStore((state) => state.phase);

  const active = items[topIndex] ?? items[0];
  const hidden = phase !== "idle" && phase !== "returning";

  return (
    <div
      data-ring-caption
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-5 py-5 transition-opacity duration-300 md:px-10 md:py-7 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="ui-label text-ash tabular-nums">
        {pad3(topIndex + 1)}
      </span>

      <span className="ui-label absolute left-1/2 -translate-x-1/2 text-chalk">
        {active?.title ?? ""}
      </span>

      <span className="ui-label text-ash">
        {active?.category ?? ""}
      </span>
    </div>
  );
}
