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

/** Tuning knobs for the ellipse the photos sit on. */
const DESKTOP = {
  rxRatio: 0.3,
  ryRatio: 0.3,
  boxRatio: 0.11,
  minBoxWidth: 120,
  maxBoxWidth: 220,
} as const;

const MOBILE = {
  rxRatio: 0.34,
  ryRatio: 0.3,
  boxRatio: 0.26,
  minBoxWidth: 72,
  maxBoxWidth: 132,
} as const;

const PORTRAIT_RATIO = 4 / 3;
const MOBILE_BREAKPOINT = 768;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function computeRingGeometry(
  viewportWidth: number,
  viewportHeight: number,
): RingGeometry {
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const preset = isMobile ? MOBILE : DESKTOP;

  const boxWidth = clamp(
    preset.boxRatio * viewportWidth,
    preset.minBoxWidth,
    preset.maxBoxWidth,
  );

  return {
    cx: viewportWidth / 2,
    cy: viewportHeight / 2,
    rx: preset.rxRatio * viewportWidth,
    ry: preset.ryRatio * viewportHeight,
    boxWidth,
    boxHeight: boxWidth * PORTRAIT_RATIO,
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
