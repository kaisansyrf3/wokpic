import Image from "next/image";

import { TOP, stepAngle } from "@/animations/ringLayout";

export type PreviewItem = {
  id: string;
  title: string;
  thumbUrl: string | null;
};

/**
 * A still sketch of the landing ring so the order can be judged in context.
 * It shares the angle maths with the real ring but uses percentage positions.
 */
export function RingPreview({ items }: { items: PreviewItem[] }) {
  const step = stepAngle(items.length);

  return (
    <div className="relative mx-auto aspect-4/3 w-full max-w-md border border-line bg-ink">
      <span className="ui-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ash">
        Pratinjau
      </span>

      {items.map((item, index) => {
        const angle = TOP + index * step;
        const left = 50 + 38 * Math.cos(angle);
        const top = 50 + 36 * Math.sin(angle);

        return (
          <div
            key={item.id}
            className="absolute aspect-4/3 w-[20%] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-ink-soft"
            style={{ left: `${left}%`, top: `${top}%`, zIndex: index + 1 }}
            title={item.title}
          >
            {item.thumbUrl ? (
              <Image
                src={item.thumbUrl}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
