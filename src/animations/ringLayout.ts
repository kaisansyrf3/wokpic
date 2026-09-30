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
 * the caption. Photo size is then derived from whatever the band leaves over,
 * so a short viewport shrinks the photos instead of letting them fold over the
 * centre logo or the chrome.
 */
const DESKTOP = {
  rxRatio: 0.3,
  ryRatio: 0.27,
  boxRatio: 0.11,
  headerSpace: 96,
  footerSpace: 64,
  /** Keep this much of the ellipse free around the centre logo. */
  centreGap: 46,
  minBoxHeight: 96,
  maxBoxHeight: 296,
} as const;

const MOBILE = {
  rxRatio: 0.34,
  ryRatio: 0.28,
  boxRatio: 0.26,
  headerSpace: 80,
  footerSpace: 56,
  centreGap: 34,
  minBoxHeight: 96,
  maxBoxHeight: 180,
} as const;

const PORTRAIT_RATIO = 4 / 3;
const MOBILE_BREAKPOINT = 768;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function computeRingGeometry(
  viewportWidth: number,
  viewportHeight: number,
): RingGeometry {
  const preset = viewportWidth < MOBILE_BREAKPOINT ? MOBILE : DESKTOP;

  const band = Math.max(
    preset.minBoxHeight + 2 * preset.centreGap,
    viewportHeight - preset.headerSpace - preset.footerSpace,
  );

  const ry = Math.min(
    preset.ryRatio * viewportHeight,
    (band - preset.minBoxHeight) / 2,
  );

  // A photo may not cross the centre logo, nor poke out of the band. The 44px
  // floor keeps a tap target; below that the ring simply stops fitting.
  // The area floor stops narrow-tall screens (tablet portrait) from getting
  // postage-stamp photos, because width alone would drive the size there.
  const boxHeight = clamp(
    Math.min(
      Math.max(preset.boxRatio * viewportWidth, 0.16 * Math.min(viewportWidth, viewportHeight)) *
        PORTRAIT_RATIO,
      preset.maxBoxHeight,
      2 * (ry - preset.centreGap),
      band - 2 * ry,
    ),
    44,
    preset.maxBoxHeight,
  );

  return {
    cx: viewportWidth / 2,
    cy: preset.headerSpace + band / 2,
    rx: preset.rxRatio * viewportWidth,
    ry,
    boxWidth: boxHeight / PORTRAIT_RATIO,
    boxHeight,
  };
}

export function stepAngle(count: number): number {
  return count > 0 ? TAU / count : 0;
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
