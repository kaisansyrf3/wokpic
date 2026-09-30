import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Viewer } from "@/components/viewer/Viewer";
import { siteConfig } from "@/config/site";
import { getHeroItems, getPublishedProjectBySlug } from "@/lib/supabase/queries";

type ViewerPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ViewerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return {};

  const cover = project.photos[0];

  return {
    title: project.title,
    description: project.description ?? siteConfig.description,
    openGraph: cover
      ? {
          title: `${project.title} — ${siteConfig.name}`,
          description: project.description ?? siteConfig.description,
          images: [
            {
              url: cover.url,
              width: cover.width ?? undefined,
              height: cover.height ?? undefined,
              alt: project.title,
            },
          ],
        }
      : undefined,
  };
}

export default async function ViewerPage({ params }: ViewerPageProps) {
  const { slug } = await params;

  const [project, heroItems] = await Promise.all([
    getPublishedProjectBySlug(slug),
    getHeroItems(),
  ]);

  if (!project) notFound();

  const heroIndex = heroItems.findIndex((item) => item.slug === slug);

  return (
    <Viewer
      slug={project.slug}
      title={project.title}
      photos={project.photos}
      heroIndex={heroIndex}
      heroCount={heroItems.length}
    />
  );
}
