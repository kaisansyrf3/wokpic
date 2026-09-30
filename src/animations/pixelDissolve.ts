import gsap from "@/lib/gsap";
import {
  computePhotoRect,
  resolvePhotoFit,
  type PhotoFit,
} from "@/animations/expandToViewer";

export const DISSOLVE_GRID_DESKTOP = { cols: 48, rows: 32 } as const;
export const DISSOLVE_GRID_MOBILE = { cols: 32, rows: 22 } as const;
export const DISSOLVE_DURATION = 1.1;
export const DISSOLVE_STAGGER = 0.5;
export const DISSOLVE_DRIFT = 170;

type SourceRect = { x: number; y: number; w: number; h: number };

type Particle = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  driftX: number;
  driftY: number;
  progress: number;
};

function computeSourceRect(
  image: HTMLImageElement,
  fit: PhotoFit,
  viewportWidth: number,
  viewportHeight: number,
): SourceRect {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  if (fit === "contain") {
    return { x: 0, y: 0, w: naturalWidth, h: naturalHeight };
  }

  const scale = Math.max(
    viewportWidth / naturalWidth,
    viewportHeight / naturalHeight,
  );
  const w = viewportWidth / scale;
  const h = viewportHeight / scale;

  return { x: (naturalWidth - w) / 2, y: (naturalHeight - h) / 2, w, h };
}

/**
 * Shatters the currently displayed photo into pixel blocks on a single canvas.
 * One gsap tween drives every particle's progress (staggered from a random
 * block) and a single ticker callback repaints, so there is no DOM per block.
 * Returns a cancel function.
 */
export function runPixelDissolve(options: {
  image: HTMLImageElement;
  canvas: HTMLCanvasElement;
  onComplete?: () => void;
}): () => void {
  const { image, canvas, onComplete } = options;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(viewportWidth * dpr);
  canvas.height = Math.round(viewportHeight * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    onComplete?.();
    return () => undefined;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const fit = resolvePhotoFit(viewportWidth, viewportHeight);
  const dest = computePhotoRect(
    image.naturalWidth,
    image.naturalHeight,
    viewportWidth,
    viewportHeight,
  );
  const src = computeSourceRect(image, fit, viewportWidth, viewportHeight);

  const grid = viewportWidth < 768 ? DISSOLVE_GRID_MOBILE : DISSOLVE_GRID_DESKTOP;

  const particles: Particle[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      particles.push({
        sx: src.x + (col / grid.cols) * src.w,
        sy: src.y + (row / grid.rows) * src.h,
        sw: src.w / grid.cols,
        sh: src.h / grid.rows,
        dx: dest.left + (col / grid.cols) * dest.width,
        dy: dest.top + (row / grid.rows) * dest.height,
        dw: dest.width / grid.cols,
        dh: dest.height / grid.rows,
        driftX: (Math.random() - 0.5) * DISSOLVE_DRIFT,
        driftY: (Math.random() - 0.5) * DISSOLVE_DRIFT,
        progress: 0,
      });
    }
  }

  const render = () => {
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    for (const particle of particles) {
      const eased = particle.progress;

      if (eased >= 1) continue;

      if (eased <= 0) {
        ctx.globalAlpha = 1;
        ctx.drawImage(
          image,
          particle.sx,
          particle.sy,
          particle.sw,
          particle.sh,
          particle.dx,
          particle.dy,
          particle.dw + 0.6,
          particle.dh + 0.6,
        );
        continue;
      }

      const scale = 1 - eased * 0.7;
      const width = particle.dw * scale;
      const height = particle.dh * scale;

      ctx.globalAlpha = 1 - eased;
      ctx.drawImage(
        image,
        particle.sx,
        particle.sy,
        particle.sw,
        particle.sh,
        particle.dx + particle.driftX * eased + (particle.dw - width) / 2,
        particle.dy + particle.driftY * eased + (particle.dh - height) / 2,
        width + 0.6,
        height + 0.6,
      );
    }

    ctx.globalAlpha = 1;
  };

  // Paint the intact photo first so hiding the DOM photo is seamless.
  render();
  canvas.style.opacity = "1";

  const tween = gsap.to(particles, {
    progress: 1,
    duration: DISSOLVE_DURATION,
    ease: "power2.in",
    stagger: { from: "random", amount: DISSOLVE_STAGGER },
  });

  gsap.ticker.add(render);

  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    gsap.ticker.remove(render);
    tween.kill();
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    canvas.style.opacity = "0";
  };

  tween.eventCallback("onComplete", () => {
    cancel();
    onComplete?.();
  });

  return cancel;
}
