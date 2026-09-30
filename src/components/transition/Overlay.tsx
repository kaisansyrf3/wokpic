"use client";

type OverlayProps = {
  ref?: React.Ref<HTMLDivElement>;
};

/** Dark veil held over the viewport during the dissolve -> landing handoff. */
export function Overlay({ ref }: OverlayProps) {
  return (
    <div
      ref={ref}
      data-transition-overlay
      className="absolute inset-0 bg-ink opacity-0"
    />
  );
}
