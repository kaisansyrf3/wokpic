import gsap from "@/lib/gsap";
import { EXPAND_EASE, EXPAND_DURATION, FADE_EASE } from "@/animations/easings";
import { getViewerFrameRect } from "@/lib/viewerFrame";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Gambar gagal dimuat: ${url}`));
    image.src = url;
  });
}

/** Resolves only once the pixels are actually decoded, so nothing blurs mid-flight. */
export async function loadDecodedImage(url: string): Promise<HTMLImageElement> {
  const image = await loadImage(url);
  await image.decode().catch(() => undefined);
  return image;
}

type PendingClone = {
  wrapper: HTMLDivElement;
  source: HTMLElement | null;
  timeline: gsap.core.Timeline | null;
};

let pending: PendingClone | null = null;
let safetyTimer: number | null = null;

/** Called by the viewer once its own copy of the photo is decoded and painted. */
export function clearPendingClone() {
  if (safetyTimer !== null) {
    window.clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  if (!pending) return;

  pending.timeline?.kill();
  pending.wrapper.remove();
  if (pending.source) pending.source.style.visibility = "";
  pending = null;
}

export type ExpandOptions = {
  source: HTMLElement;
  url: string;
  cloneLayer: HTMLElement;
  fadeOut: Array<HTMLElement | null>;
  onArrived: () => void;
};

export async function expandToViewer({
  source,
  url,
  cloneLayer,
  fadeOut,
  onArrived,
}: ExpandOptions): Promise<void> {
  clearPendingClone();

  const startRect = source.getBoundingClientRect();
  await loadDecodedImage(url);

  // Both the clone and the viewer read the same function, so the clone lands
  // exactly on the frame the photo will be shown in.
  const target = getViewerFrameRect(window.innerWidth, window.innerHeight);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-expand-clone", "");
  wrapper.style.cssText = [
    "position:fixed",
    "margin:0",
    "padding:0",
    "overflow:hidden",
    "pointer-events:none",
    `top:${startRect.top}px`,
    `left:${startRect.left}px`,
    `width:${startRect.width}px`,
    `height:${startRect.height}px`,
    "will-change:top,left,width,height",
  ].join(";");

  const clone = document.createElement("img");
  clone.src = url;
  clone.alt = "";
  clone.draggable = false;
  clone.decoding = "sync";
  clone.style.cssText = "display:block;width:100%;height:100%;object-fit:contain;";

  wrapper.appendChild(clone);
  cloneLayer.appendChild(wrapper);

  source.style.visibility = "hidden";

  const timeline = gsap.timeline({ onComplete: onArrived });
  timeline.to(
    fadeOut.filter(Boolean) as HTMLElement[],
    {
      opacity: 0,
      duration: EXPAND_DURATION * 0.6,
      ease: FADE_EASE,
    },
    0,
  );
  timeline.to(
    wrapper,
    {
      top: target.top,
      left: target.left,
      width: target.width,
      height: target.height,
      duration: EXPAND_DURATION,
      ease: EXPAND_EASE,
    },
    0,
  );

  pending = { wrapper, source, timeline };

  // If the viewer never mounts (failed navigation, error page) the clone must
  // not stay pinned over the screen forever.
  safetyTimer = window.setTimeout(clearPendingClone, 4000);
}
