import { siteConfig } from "@/config/site";

export type CenterLogoProps = {
  /** Passed as a plain prop (React 19) so the ring can position it from geometry. */
  ref?: React.Ref<HTMLDivElement>;
};

export function CenterLogo({ ref }: CenterLogoProps) {
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-30 text-center select-none"
      aria-hidden
    >
      <span className="block text-base font-light uppercase tracking-[0.34em] text-chalk md:text-lg">
        {siteConfig.wordmark}
      </span>
      <span className="ui-label mt-2 block text-[9px] text-ash">
        {siteConfig.tagline}
      </span>
    </div>
  );
}
