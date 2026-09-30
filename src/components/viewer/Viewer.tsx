"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { CROSSFADE_DURATION, CROSSFADE_EASE } from "@/animations/easings";
import {
  clearPendingClone,
  loadDecodedImage,
  resolvePhotoFit,
  type PhotoFit,
} from "@/animations/expandToViewer";
import { ViewerControls } from "@/components/viewer/ViewerControls";
import gsap from "@/lib/gsap";
import { useTransitionStore } from "@/store/transition";
import type { ProjectPhoto } from "@/types/content";

type ViewerProps = {
  title: string;
  photos: ProjectPhoto[];
};

const SWIPE_THRESHOLD = 48;

export function Viewer({ title, photos }: ViewerProps) {
  const router = useRouter();

  const [front, setFront] = useState(0);
  const [back, setBack] = useState<number | null>(null);
  const [fit, setFit] = useState<PhotoFit>("contain");
  const [controlsVisible, setControlsVisible] = useState(true);

  const frontRef = useRef<HTMLImageElement>(null);
  const fadeTweenRef = useRef<gsap.core.Tween | null>(null);
  const indexRef = useRef(0);
  const firstPaintRef = useRef(true);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const total = photos.length;

  useLayoutEffect(() => {
    const update = () =>
      setFit(resolvePhotoFit(window.innerWidth, window.innerHeight));
    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    useTransitionStore.getState().setPhase("viewing");

    return () => {
      const store = useTransitionStore.getState();
      if (store.phase === "viewing") store.setPhase("idle");
    };
  }, []);

  // Keep the neighbours warm so stepping never waits on the network.
  useEffect(() => {
    if (total < 2) return;
    const next = (indexRef.current + 1) % total;
    const prev = (indexRef.current - 1 + total) % total;
    for (const photoIndex of [next, prev]) {
      loadDecodedImage(photos[photoIndex].url).catch(() => undefined);
    }
  }, [front, photos, total]);

  const handleFrontLoad = useCallback(() => {
    const element = frontRef.current;
    if (!element) return;

    if (firstPaintRef.current) {
      firstPaintRef.current = false;
      gsap.set(element, { opacity: 1 });
      element
        .decode()
        .catch(() => undefined)
        .then(() => {
          requestAnimationFrame(() => clearPendingClone());
        });
      return;
    }

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
  }, []);

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
    if (store.phase !== "viewing") return;
    setControlsVisible(false);
    router.push("/");
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

  return (
    <div
      className="absolute inset-0 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {backPhoto ? (
        <img
          key={`back-${backPhoto.id}`}
          src={backPhoto.url}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: fit }}
        />
      ) : null}

      <img
        key={`front-${frontPhoto.id}`}
        ref={frontRef}
        src={frontPhoto.url}
        alt={title}
        crossOrigin="anonymous"
        decoding="async"
        draggable={false}
        onLoad={handleFrontLoad}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: fit, opacity: 0 }}
      />

      <ViewerControls
        visible={controlsVisible}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onClose={handleClose}
      />
    </div>
  );
}
