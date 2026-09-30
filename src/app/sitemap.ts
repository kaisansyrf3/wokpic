import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getPublishedSlugs } from "@/lib/supabase/queries";

const PRIORITY = { home: 1, contact: 0.9, service: 0.8, work: 0.7, about: 0.6 } as const;

function url(path: string): string {
  return path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A build without Supabase access must still emit a usable sitemap.
  const slugs = await getPublishedSlugs().catch(() => []);

  return [
    { url: url("/"), changeFrequency: "weekly", priority: PRIORITY.home },
    { url: url("/service"), changeFrequency: "monthly", priority: PRIORITY.service },
    { url: url("/about"), changeFrequency: "yearly", priority: PRIORITY.about },
    { url: url("/contact"), changeFrequency: "yearly", priority: PRIORITY.contact },
    ...slugs.map((slug) => ({
      url: url(`/works/${slug}`),
      changeFrequency: "monthly" as const,
      priority: PRIORITY.work,
    })),
  ];
}
