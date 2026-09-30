"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { FADE_EASE, RETURN_FADE_DURATION, RETURN_HOLD } from "@/animations/easings";
import { baseAngle, clockwiseDelta, computeRingGeometry } from "@/animations/ringLayout";
import { rotateRing, type RotationProxy } from "@/animations/ringRotate";
import { clearPendingClone, expandToViewer } from "@/animations/expandToViewer";
import { returnRing } from "@/animations/ringReturn";
import { CenterLogo } from "@/components/home/CenterLogo";
import { getTransitionNodes } from "@/components/transition/TransitionProvider";
import gsap from "@/lib/gsap";
import { useTransitionStore } from "@/store/transition";
import type { HeroItem } from "@/types/content";

type RingGalleryProps = {
  items: HeroItem[];
};

type RingGeometry = ReturnType<typeof computeRingGeometry>;
type GsapContext = ReturnType<typeof gsap.context>;

const REVEAL_DURATION = 0.7;

export function RingGallery({ items }: RingGalleryProps) {
  const router = useRouter();

  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const photoRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const geometryRef = useRef<RingGeometry | null>(null);
  const proxyRef = useRef<RotationProxy>({ rot: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const contextRef = useRef<GsapContext | null>(null);
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

      proxyRef.current.rot = rot;

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
    const geometry = computeRingGeometry(window.innerWidth, window.innerHeight);
    geometryRef.current = geometry;

    if (logoRef.current) {
      gsap.set(logoRef.current, {
        x: geometry.cx,
        y: geometry.cy,
        xPercent: -50,
        yPercent: -50,
      });
    }

    applyLayout(proxyRef.current.rot);
  }, [applyLayout]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {}, rootRef);
    contextRef.current = context;

    // Returning from the viewer: start already rotated so the photo that was
    // open sits on top, and keep the ring hidden until that is applied.
    const store = useTransitionStore.getState();
    if (store.returning && store.delta > 0) {
      proxyRef.current.rot = store.delta;
      store.setTopIndex(store.selectedIndex ?? 0);
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      tweenRef.current?.kill();
      tweenRef.current = null;
      context.revert();
      contextRef.current = null;
    };
  }, [measure]);

  // Cached images can finish before React attaches onLoad, so sweep once too.
  useEffect(() => {
    photoRefs.current.forEach((element, index) => {
      const image = element?.querySelector("img");
      if (image?.complete && image.naturalWidth > 0) markLoaded(index);
    });
  }, [items, markLoaded]);

  // Nothing is shown until every thumbnail has decoded, so there is no pop-in.
  useEffect(() => {
    if (!ready || !rootRef.current) return;

    const store = useTransitionStore.getState();

    if (!store.returning) {
      // Browser back, or a landing mount caught mid-transition: show the ring
      // at its resting position instead of replaying an animation.
      if (store.phase !== "idle") store.reset();

      gsap.to(rootRef.current, {
        opacity: 1,
        duration: REVEAL_DURATION,
        ease: FADE_EASE,
      });
      return;
    }

    const delta = store.delta;

    const timeline = gsap.timeline({
      onComplete: () => {
        if (delta <= 0) {
          useTransitionStore.getState().reset();
          return;
        }

        contextRef.current?.add(() => {
          tweenRef.current = returnRing({
            proxy: proxyRef.current,
            from: delta,
            onLayout: applyLayout,
            onComplete: () => useTransitionStore.getState().reset(),
          });
        });
      },
    });

    timeline
      .to(rootRef.current, {
        opacity: 1,
        duration: RETURN_FADE_DURATION,
        ease: FADE_EASE,
      })
      .to({}, { duration: RETURN_HOLD });
  }, [ready, applyLayout]);

  const handleRotationComplete = useCallback(
    (index: number) => {
      tweenRef.current = null;

      const store = useTransitionStore.getState();
      store.setTopIndex(index);

      const item = items[index];
      const source = photoRefs.current[index];
      const cloneLayer = getTransitionNodes().cloneLayer;

      if (!item || !source || !cloneLayer) {
        store.setPhase("idle");
        return;
      }

      store.setPhase("expanding");

      expandToViewer({
        source,
        url: item.url,
        cloneLayer,
        fadeOut: [
          rootRef.current,
          document.querySelector<HTMLElement>("[data-ring-caption]"),
          document.querySelector<HTMLElement>("[data-site-header]"),
        ],
        onArrived: () => router.push(`/works/${item.slug}`),
      }).catch(() => {
        clearPendingClone();
        useTransitionStore.getState().setPhase("idle");
      });
    },
    [items, router],
  );

  const handleSelect = useCallback(
    (index: number) => {
      const store = useTransitionStore.getState();
      if (store.phase !== "idle") return;

      const item = items[index];
      if (!item) return;

      tweenRef.current?.kill();

      const delta = clockwiseDelta(index, count);
      store.select({ slug: item.slug, index, delta });

      if (delta === 0) {
        handleRotationComplete(index);
        return;
      }

      const proxy = proxyRef.current;
      contextRef.current?.add(() => {
        tweenRef.current = rotateRing({
          proxy,
          to: delta,
          onLayout: applyLayout,
          onComplete: () => handleRotationComplete(index),
        });
      });
    },
    [applyLayout, count, handleRotationComplete, items],
  );

  return (
    <div ref={rootRef} data-ring-gallery className="absolute inset-0" style={{ opacity: 0 }}>
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
          onClick={() => handleSelect(index)}
          className="absolute left-0 top-0 cursor-pointer overflow-hidden p-0"
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
      <CenterLogo ref={logoRef} />
    </div>
  );
}
