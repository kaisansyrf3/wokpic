import { siteConfig } from "@/config/site";

export function CenterLogo() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 text-center select-none"
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
