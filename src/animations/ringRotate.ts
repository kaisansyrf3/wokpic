import gsap from "@/lib/gsap";
import { ROTATE_EASE } from "@/animations/easings";
import { TAU } from "@/animations/ringLayout";

export type RotationProxy = { rot: number };

/** Spec 2.4: 0.8s for a hair of rotation, up to 2.0s for a full turn. */
export function rotationDuration(delta: number): number {
  return 0.8 + (delta / TAU) * 1.2;
}

export function rotateRing(options: {
  proxy: RotationProxy;
  to: number;
  onLayout: (rot: number) => void;
  onComplete?: () => void;
}): gsap.core.Tween {
  const { proxy, to, onLayout, onComplete } = options;

  return gsap.to(proxy, {
    rot: to,
    duration: rotationDuration(Math.abs(to - proxy.rot)),
    ease: ROTATE_EASE,
    onUpdate: () => onLayout(proxy.rot),
    onComplete,
  });
}
