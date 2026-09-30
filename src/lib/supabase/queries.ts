import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database, SocialLink } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectImage = Database["public"]["Tables"]["project_images"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

export type RingImage = {
  url: string;
  thumbUrl: string;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
};

export type HeroItem = RingImage & {
  position: number;
  projectId: string;
  slug: string;
  title: string;
  category: string | null;
};

export type ServiceWithFeatures = Omit<Service, "features"> & {
  features: string[];
};

export type AboutContent = {
  name: string | null;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
  socialLinks: SocialLink[];
};

/**
 * Public reads use a cookieless anon client so pages stay statically renderable
 * and `revalidatePath()` from admin actions is what refreshes them.
 */
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi.",
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.platform !== "string" || typeof candidate.url !== "string") {
      return [];
    }
    return [{ platform: candidate.platform, url: candidate.url }];
  });
}

function toRingImage(image: ProjectImage): RingImage {
  return {
    url: image.url,
    thumbUrl: image.thumb_url ?? image.url,
    blurDataUrl: image.blur_data_url,
    width: image.width,
    height: image.height,
  };
}

/** Hero ring items, ordered by position. Tolerates fewer than 8 rows. */
export async function getHeroItems(): Promise<HeroItem[]> {
  const supabase = publicClient();

  const { data, error } = await supabase
    .from("hero_items")
    .select(
      `
      position,
      projects (
        id, slug, title, category, published,
        project_images ( id, url, thumb_url, width, height, blur_data_url, is_cover, sort_order )
      )
      `,
    )
    .order("position", { ascending: true });

  if (error) throw new Error(`Gagal memuat hero: ${error.message}`);

  const items: HeroItem[] = [];

  for (const row of data ?? []) {
    const project = row.projects as unknown as (Project & {
      project_images: ProjectImage[];
    }) | null;
    if (!project || !project.published) continue;

    const images = project.project_images ?? [];
    const cover = images.find((image) => image.is_cover) ?? images[0];
    if (!cover) continue;

    items.push({
      ...toRingImage(cover),
      position: row.position,
      projectId: project.id,
      slug: project.slug,
      title: project.title,
      category: project.category,
    });
  }

  return items;
}

export async function getPublishedProjectBySlug(
  slug: string,
): Promise<(Project & { images: ProjectImage[] }) | null> {
  const supabase = publicClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id, slug, title, category, description, published, created_at,
      project_images ( id, url, thumb_url, width, height, blur_data_url, is_cover, sort_order )
      `,
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat project: ${error.message}`);
  if (!data) return null;

  const project = data as unknown as Project & { project_images: ProjectImage[] };
  const images = [...(project.project_images ?? [])].sort(
    (a, b) => Number(a.is_cover) * -1 || a.sort_order - b.sort_order,
  );

  return { ...project, images };
}

export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = publicClient();

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .eq("published", true);

  if (error) throw new Error(`Gagal memuat slug: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}

export async function getActiveServices(): Promise<ServiceWithFeatures[]> {
  const supabase = publicClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Gagal memuat paket: ${error.message}`);

  return (data ?? []).map((service) => ({
    ...service,
    features: parseFeatures(service.features),
  }));
}

export async function getAboutContent(): Promise<AboutContent> {
  const supabase = publicClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat pengaturan situs: ${error.message}`);

  const settings: SiteSettings | null = data;

  return {
    name: settings?.about_name ?? null,
    role: settings?.about_role ?? null,
    bio: settings?.about_bio ?? null,
    photoUrl: settings?.about_photo_url ?? null,
    socialLinks: parseSocialLinks(settings?.social_links),
  };
}
