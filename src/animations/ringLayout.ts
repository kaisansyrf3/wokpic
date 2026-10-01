import { MOBILE_BREAKPOINT } from "@/lib/viewport";

export const TOP = -Math.PI / 2;
export const TAU = Math.PI * 2;

export type RingGeometry = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  boxWidth: number;
  boxHeight: number;
};

/**
 * The ring is laid out inside a vertical band that sits between the header and
 * the caption. Tiles are 4:3 landscape, so their width is derived from whatever
 * the band and the ellipse leave over: a short viewport shrinks the photos
 * instead of letting them fold over the centre caption or the chrome.
 */
const DESKTOP = {
  rxRatio: 0.3,
  ryRatio: 0.27,
  widthRatio: 0.14,
  headerSpace: 96,
  footerSpace: 64,
  sideMargin: 24,
  /** Keep this much of the ellipse free around the centre caption. */
  centreGap: 46,
  minBoxWidth: 96,
  maxBoxWidth: 320,
} as const;

const MOBILE = {
  rxRatio: 0.36,
  ryRatio: 0.3,
  widthRatio: 0.28,
  headerSpace: 80,
  footerSpace: 56,
  sideMargin: 6,
  centreGap: 34,
  minBoxWidth: 72,
  maxBoxWidth: 220,
} as const;

/** Landscape tiles: width / height. */
const TILE_RATIO = 4 / 3;

/**
 * Adjacent tiles sit TAU/8 apart, so the horizontal distance between the tile at
 * 12 o'clock and its neighbours is rx * COS45. A tile narrower than that stays
 * fully visible once the rotation settles instead of being clipped by the two
 * tiles beside it.
 */
const COS45 = Math.SQRT1_2;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function computeRingGeometry(
  viewportWidth: number,
  viewportHeight: number,
): RingGeometry {
  const preset = viewportWidth < MOBILE_BREAKPOINT ? MOBILE : DESKTOP;

  const band = viewportHeight - preset.headerSpace - preset.footerSpace;
  const rx = preset.rxRatio * viewportWidth;

  let boxWidth = clamp(
    Math.min(
      preset.widthRatio * viewportWidth,
      preset.maxBoxWidth,
      // No tile may poke past the edge of the screen.
      2 * (viewportWidth / 2 - preset.sideMargin - rx),
      // The 12 o'clock tile must stay clear of its neighbours. The factor keeps
      // a hair of daylight between them once the ellipse is squashed flat.
      0.98 * COS45 * rx,
      // A tile may not cross the centre caption.
      2 * (rx - preset.centreGap),
    ),
    preset.minBoxWidth,
    preset.maxBoxWidth,
  );

  let boxHeight = boxWidth / TILE_RATIO;

  // On a short viewport the band, not the tiles, gives way first; only when even
  // that leaves no room for the caption does the ring shrink.
  if (boxHeight > band - 2 * preset.centreGap) {
    boxHeight = Math.max(44, band - 2 * preset.centreGap);
    boxWidth = boxHeight * TILE_RATIO;
  }

  // Folding over the header or the caption is worse than a flat ellipse.
  const ry = Math.min(preset.ryRatio * viewportHeight, (band - boxHeight) / 2);

  return {
    cx: viewportWidth / 2,
    cy: preset.headerSpace + band / 2,
    rx,
    ry: Math.max(0, ry),
    boxWidth,
    boxHeight,
  };
}

export function stepAngle(count: number): number {
  return count > 0 ? TAU / count : 0;
}

/** Narrowest box the centre caption may be squeezed into, in px. */
export const CAPTION_MIN_WIDTH = 88;

/** Widest it may grow, even on a huge screen: it must stay a whisper. */
const CAPTION_MAX_WIDTH = 220;

/**
 * The widest the centre caption may be: only tiles that reach into the caption's
 * own vertical band can block it, and taking 60% of the daylight they leave over
 * keeps a visible gap instead of an accidental collision. Pass the caption
 * measured at CAPTION_MIN_WIDTH so a taller wrap can never reach into a tile.
 */
export function centreCaptionWidth(
  viewportWidth: number,
  viewportHeight: number,
  count: number,
  captionHeight: number,
): number {
  const { rx, ry, boxWidth, boxHeight } = computeRingGeometry(viewportWidth, viewportHeight);

  let half = rx - boxWidth / 2;
  for (let index = 0; index < count; index++) {
    const angle = baseAngle(index, count);
    const y = ry * Math.sin(angle);
    if (Math.abs(y) > (boxHeight + captionHeight) / 2) continue;
    half = Math.min(half, Math.abs(rx * Math.cos(angle)) - boxWidth / 2);
  }

  return Math.max(CAPTION_MIN_WIDTH, Math.min(CAPTION_MAX_WIDTH, Math.max(0, half) * 2 * 0.6));
}

export function baseAngle(index: number, count: number): number {
  return TOP + index * stepAngle(count);
}

/**
 * Clockwise rotation needed to bring `index` to the 12 o'clock slot.
 * Always takes the clockwise path, never the shortest one.
 */
export function clockwiseDelta(index: number, count: number): number {
  const step = stepAngle(count);
  if (step === 0) return 0;
  const raw = TOP - baseAngle(index, count);
  return ((raw % TAU) + TAU) % TAU;
}
