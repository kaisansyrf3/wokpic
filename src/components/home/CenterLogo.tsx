import Image from "next/image";

import { siteConfig } from "@/config/site";

export type CenterLogoProps = {
  /** Passed as a plain prop (React 19) so the ring can position it from geometry. */
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * The still mark in the middle of the ring. Deliberately small and never
 * animated: the photos are the thing being looked at.
 */
export function CenterLogo({ ref }: CenterLogoProps) {
  const { logo } = siteConfig;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-30 w-[clamp(36px,12vw,52px)] select-none md:w-[clamp(40px,4.5vw,72px)]"
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        sizes="(max-width: 767px) 52px, 72px"
        priority
        draggable={false}
        className="h-auto w-full"
      />
    </div>
  );
}
