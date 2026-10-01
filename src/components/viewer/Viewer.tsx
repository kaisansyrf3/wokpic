"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  CLOSE_CONTROLS_DURATION,
  CLOSE_PHOTO_DURATION,
  CONTACT_FADE_DURATION,
  CONTROLS_FADE_DURATION,
  CROSSFADE_DURATION,
  CROSSFADE_EASE,
  FADE_EASE,
} from "@/animations/easings";
import { clearPendingClone, loadDecodedImage } from "@/animations/expandToViewer";
import { clockwiseDelta } from "@/animations/ringLayout";
import { ViewerControls } from "@/components/viewer/ViewerControls";
import gsap from "@/lib/gsap";
import { getViewerFrameRect } from "@/lib/viewerFrame";
import { useTransitionStore } from "@/store/transition";
import type { ProjectPhoto } from "@/types/content";

type ViewerProps = {
  slug: string;
  title: string;
  photos: ProjectPhoto[];
  /** Position of this project in the hero ring, or -1 when it is not in the ring. */
  heroIndex: number;
  heroCount: number;
};

const SWIPE_THRESHOLD = 48;

export function Viewer({ slug, title, photos, heroIndex, heroCount }: ViewerProps) {
  const router = useRouter();

  const [front, setFront] = useState(0);
  const [back, setBack] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLImageElement>(null);
  const fadeTweenRef = useRef<gsap.core.Tween | null>(null);
  const indexRef = useRef(0);
  const firstPaintRef = useRef(true);
  const leavingRef = useRef(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const total = photos.length;
  const frame = getViewerFrameRect(viewport.width, viewport.height);

  useLayoutEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    const store = useTransitionStore.getState();

    // Direct URL / refresh: the store is empty, so rebuild the rotation the
    // landing will need from this project's slot in the hero ring.
    if (store.selectedSlug === null && heroIndex >= 0) {
      store.hydrate({
        slug,
        index: heroIndex,
        delta: clockwiseDelta(heroIndex, heroCount),
      });
    }

    store.setPhase("viewing");

    return () => {
      const current = useTransitionStore.getState();
      if (current.phase === "viewing") current.setPhase("idle");
    };
  }, [heroCount, heroIndex, slug]);

  // Keep the neighbours warm so stepping never waits on the network.
  useEffect(() => {
    if (total < 2) return;
    const next = (indexRef.current + 1) % total;
    const prev = (indexRef.current - 1 + total) % total;
    for (const photoIndex of [next, prev]) {
      loadDecodedImage(photos[photoIndex].url).catch(() => undefined);
    }
  }, [front, photos, total]);

  const revealControls = useCallback(() => {
    const element = containerRef.current?.querySelector("[data-viewer-controls]");
    if (!element) return;

    gsap.to(element, {
      opacity: 1,
      duration: CONTROLS_FADE_DURATION,
      ease: FADE_EASE,
    });
  }, []);

  // The clone is only removed once the viewer's own pixels are on screen, so
  // the handover between the two never flashes.
  const settleFirstPaint = useCallback(() => {
    if (!firstPaintRef.current) return false;
    firstPaintRef.current = false;

    const element = frontRef.current;
    if (element) gsap.set(element, { opacity: 1 });

    const decoded = element?.decode() ?? Promise.resolve();
    decoded
      .catch(() => undefined)
      .then(() => {
        requestAnimationFrame(() => {
          clearPendingClone();
          revealControls();
        });
      });

    return true;
  }, [revealControls]);

  const handleFrontLoad = useCallback(() => {
    if (settleFirstPaint()) return;

    const element = frontRef.current;
    if (!element) return;

    fadeTweenRef.current?.kill();
    fadeTweenRef.current = gsap.fromTo(
      element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: CROSSFADE_DURATION,
        ease: CROSSFADE_EASE,
        onComplete: () => setBack(null),
      },
    );
  }, [settleFirstPaint]);

  // A cached image can finish before React attaches onLoad.
  useLayoutEffect(() => {
    const element = frontRef.current;
    if (element?.complete && element.naturalWidth > 0) handleFrontLoad();
  }, [front, handleFrontLoad]);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      const store = useTransitionStore.getState();
      if (store.phase !== "viewing" || total < 2) return;

      const old = indexRef.current;
      const next = (old + direction + total) % total;
      indexRef.current = next;

      fadeTweenRef.current?.kill();
      setBack(old);
      setFront(next);
    },
    [total],
  );

  const handleClose = useCallback(() => {
    const store = useTransitionStore.getState();
    if (store.phase !== "viewing" || leavingRef.current) return;

    leavingRef.current = true;
    store.setPhase("closing");
    fadeTweenRef.current?.kill();

    const goHome = () => {
      useTransitionStore.getState().beginReturn();
      router.push("/");
    };

    const container = containerRef.current;
    if (!container) {
      goHome();
      return;
    }

    const controls = container.querySelector("[data-viewer-controls]");
    const images = container.querySelectorAll("img");

    const timeline = gsap.timeline({ onComplete: goHome });
    if (controls) {
      timeline.to(controls, {
        opacity: 0,
        duration: CLOSE_CONTROLS_DURATION,
        ease: FADE_EASE,
      }, 0);
    }
    if (images.length > 0) {
      timeline.to(images, {
        opacity: 0,
        duration: CLOSE_PHOTO_DURATION,
        ease: FADE_EASE,
      }, CLOSE_CONTROLS_DURATION * 0.5);
    }
  }, [router]);

  const handleContact = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    // Leave nothing behind: the next visit to the landing should show the ring
    // at rest, not replay the return animation.
    useTransitionStore.getState().reset();

    const go = () => router.push("/service");
    const container = containerRef.current;
    if (!container) {
      go();
      return;
    }

    gsap.to(container, {
      opacity: 0,
      duration: CONTACT_FADE_DURATION,
      ease: FADE_EASE,
      onComplete: go,
    });
  }, [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") navigate(1);
      else if (event.key === "ArrowLeft") navigate(-1);
      else if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, navigate]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start) return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

      navigate(dx < 0 ? 1 : -1);
    },
    [navigate],
  );

  const frontPhoto = photos[front];
  const backPhoto = back !== null ? photos[back] : null;

  if (viewport.width === 0) {
    return <div ref={containerRef} className="absolute inset-0" />;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="absolute overflow-hidden"
        style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
      >
        {backPhoto ? (
          <img
            key={`back-${backPhoto.id}`}
            src={backPhoto.url}
            alt=""
            aria-hidden
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : null}

        <img
          key={`front-${frontPhoto.id}`}
          ref={frontRef}
          src={frontPhoto.url}
          alt={title}
          decoding="async"
          draggable={false}
          onLoad={handleFrontLoad}
          onError={settleFirstPaint}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: 0 }}
        />
      </div>

      <ViewerControls
        frame={frame}
        viewportWidth={viewport.width}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onClose={handleClose}
        onContact={handleContact}
      />
    </div>
  );
}
