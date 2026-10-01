import { MOBILE_BREAKPOINT } from "@/lib/viewport";

/** The viewer frames photos at the same 4:3 ratio as the ring tiles. */
export const VIEWER_RATIO = 4 / 3;

/** Vertical space reserved for the close button and "Hubungi Kami". */
const PAD_Y = 88;

const MAX_WIDTH_RATIO = { desktop: 0.88, mobile: 0.94 };

export type ViewerFrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * The one place the photo's size is decided. The viewer lays itself out with
 * this rect and `expandToViewer` animates the clone onto it, so the animation
 * can never land somewhere other than where the photo ends up sitting.
 */
export function getViewerFrameRect(
  viewportWidth: number,
  viewportHeight: number,
): ViewerFrameRect {
  const maxWidthRatio =
    viewportWidth < MOBILE_BREAKPOINT ? MAX_WIDTH_RATIO.mobile : MAX_WIDTH_RATIO.desktop;

  const maxHeight = Math.max(0, viewportHeight - PAD_Y * 2);
  const width = Math.min(viewportWidth * maxWidthRatio, maxHeight * VIEWER_RATIO);
  const height = width / VIEWER_RATIO;

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}
