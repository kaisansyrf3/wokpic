import { rotateRing, type RotationProxy } from "@/animations/ringRotate";

/**
 * Places the ring at `from` (the photo that was open sits on top) and rotates it
 * counter-clockwise back to the resting position.
 */
export function returnRing(options: {
  proxy: RotationProxy;
  from: number;
  onLayout: (rot: number) => void;
  onComplete?: () => void;
}): gsap.core.Tween {
  const { proxy, from, onLayout, onComplete } = options;

  proxy.rot = from;
  onLayout(from);

  return rotateRing({ proxy, to: 0, onLayout, onComplete });
}
