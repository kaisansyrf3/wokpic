"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { baseAngle, computeRingGeometry } from "@/animations/ringLayout";
import gsap from "@/lib/gsap";
import type { HeroItem } from "@/types/content";

type RingGalleryProps = {
  items: HeroItem[];
};

type RingGeometry = ReturnType<typeof computeRingGeometry>;

export function RingGallery({ items }: RingGalleryProps) {
  const photoRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const geometryRef = useRef<RingGeometry | null>(null);
  const rotRef = useRef(0);
  const loadedRef = useRef<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  const count = items.length;

  const markLoaded = useCallback(
    (index: number) => {
      if (loadedRef.current.has(index)) return;
      loadedRef.current.add(index);
      if (count > 0 && loadedRef.current.size >= count) setReady(true);
    },
    [count],
  );

  const applyLayout = useCallback(
    (rot: number) => {
      const geometry = geometryRef.current;
      if (!geometry) return;

      photoRefs.current.forEach((element, index) => {
        if (!element) return;
        const angle = baseAngle(index, count) + rot;
        gsap.set(element, {
          width: geometry.boxWidth,
          height: geometry.boxHeight,
          x: geometry.cx + geometry.rx * Math.cos(angle),
          y: geometry.cy + geometry.ry * Math.sin(angle),
          xPercent: -50,
          yPercent: -50,
        });
      });
    },
    [count],
  );

  const measure = useCallback(() => {
    geometryRef.current = computeRingGeometry(window.innerWidth, window.innerHeight);
    applyLayout(rotRef.current);
  }, [applyLayout]);

  useLayoutEffect(() => {
    measure();

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  // Cached images can finish before React attaches onLoad, so sweep once too.
  useEffect(() => {
    photoRefs.current.forEach((element, index) => {
      const image = element?.querySelector("img");
      if (image?.complete && image.naturalWidth > 0) markLoaded(index);
    });
  }, [items, markLoaded]);

  return (
    <div
      data-ring-gallery
      className={`absolute inset-0 transition-opacity duration-700 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      {items.map((item, index) => (
        <button
          key={item.projectId}
          ref={(element) => {
            photoRefs.current[index] = element;
          }}
          type="button"
          data-ring-index={index}
          data-slug={item.slug}
          aria-label={`Lihat project ${item.title}`}
          className="absolute left-0 top-0 cursor-pointer overflow-hidden p-0 opacity-100"
          style={{ zIndex: index + 1, border: 0, borderRadius: 0 }}
        >
          <Image
            src={item.thumbUrl}
            alt={item.title}
            fill
            priority
            sizes="(max-width: 767px) 30vw, 12vw"
            className="object-cover"
            draggable={false}
            onLoad={() => markLoaded(index)}
            onError={() => markLoaded(index)}
            {...(item.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: item.blurDataUrl }
              : {})}
          />
        </button>
      ))}
    </div>
  );
}
