import type { Metadata } from "next";

import { RingCaption } from "@/components/home/RingCaption";
import { RingGallery } from "@/components/home/RingGallery";
import { siteConfig } from "@/config/site";
import { getHeroItems } from "@/lib/supabase/queries";

export async function generateMetadata(): Promise<Metadata> {
  const items = await getHeroItems();
  const cover = items[0];

  return {
    openGraph: {
      url: siteConfig.url,
      images: cover ? [{ url: cover.url, alt: siteConfig.description }] : undefined,
    },
    twitter: cover ? { card: "summary_large_image", images: [cover.url] } : undefined,
  };
}

export default async function LandingPage() {
  const items = await getHeroItems();

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="ui-label max-w-sm text-ash">
          Portofolio sedang disiapkan. Silakan kembali beberapa saat lagi.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <RingGallery items={items} />
      <RingCaption />
    </div>
  );
}
