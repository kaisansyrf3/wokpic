"use client";

type ViewerControlsProps = {
  visible: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

const buttonClass =
  "pointer-events-auto flex items-center justify-center bg-black/45 text-chalk backdrop-blur-[2px] transition-colors hover:bg-black/70";

export function ViewerControls({ visible, onPrev, onNext, onClose }: ViewerControlsProps) {
  return (
    <div
      data-viewer-controls
      className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        tabIndex={visible ? 0 : -1}
        className={`${buttonClass} absolute left-4 top-4 h-11 w-11 text-lg`}
      >
        &#10005;
      </button>

      <button
        type="button"
        onClick={onPrev}
        aria-label="Foto sebelumnya"
        tabIndex={visible ? 0 : -1}
        className={`${buttonClass} absolute left-3 top-1/2 h-14 w-11 -translate-y-1/2 text-2xl md:left-6`}
      >
        &#8249;
      </button>

      <button
        type="button"
        onClick={onNext}
        aria-label="Foto berikutnya"
        tabIndex={visible ? 0 : -1}
        className={`${buttonClass} absolute right-3 top-1/2 h-14 w-11 -translate-y-1/2 text-2xl md:right-6`}
      >
        &#8250;
      </button>
    </div>
  );
}
