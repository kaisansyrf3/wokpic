import { FADE_EASE } from "@/animations/easings";
import gsap from "@/lib/gsap";

/**
 * Light entrance for the content pages: a short rise and fade, staggered.
 * Only transform and opacity are touched, and the caller owns teardown.
 */
export function pageReveal(root: HTMLElement) {
  const targets = root.querySelectorAll("[data-reveal]");

  return gsap.from(targets.length > 0 ? targets : root, {
    opacity: 0,
    y: 16,
    duration: 0.6,
    ease: FADE_EASE,
    stagger: 0.08,
  });
}
