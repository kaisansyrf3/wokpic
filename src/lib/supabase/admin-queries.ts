import "server-only";

import type { Database } from "@/types/database";
import type { AboutContent, AdminServiceRow, ServiceCategoryOption } from "@/types/content";
import { parseSocialLinks, readWhatsAppNumber } from "@/lib/contentParsers";
import { buildAdminServices, readServiceGraph } from "@/lib/supabase/service-graph";
import { createClient } from "@/lib/supabase/server";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectImage = Database["public"]["Tables"]["project_images"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

const IMAGE_COLUMNS = "id, url, thumb_url, width, height, blur_data_url, is_cover, sort_order";
const PROJECT_COLUMNS = "id, slug, title, category, description, published, created_at";

type ImageLite = Pick<ProjectImage, "id" | "project_id" | "url" | "thumb_url" | "is_cover">;

/** Every admin read goes through the cookie client so RLS does the enforcing. */
async function db() {
  return createClient();
}

export type ProjectRow = Project & {
  image_count: number;
  cover: Pick<ProjectImage, "id" | "thumb_url" | "url"> | null;
};

export async function listProjects(): Promise<ProjectRow[]> {
  const supabase = await db();

  const [{ data: projects, error }, { data: images }] = await Promise.all([
    supabase.from("projects").select(PROJECT_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("project_images").select("id, project_id, url, thumb_url, is_cover"),
  ]);

  if (error) throw new Error(`Gagal memuat project: ${error.message}`);

  const grouped = new Map<string, ImageLite[]>();
  for (const image of images ?? []) {
    const list = grouped.get(image.project_id) ?? [];
    list.push(image);
    grouped.set(image.project_id, list);
  }

  return (projects ?? []).map((project) => {
    const rows = grouped.get(project.id) ?? [];
    const cover = rows.find((image) => image.is_cover) ?? null;
    return {
      ...project,
      image_count: rows.length,
      cover: cover ? { id: cover.id, thumb_url: cover.thumb_url, url: cover.url } : null,
    };
  });
}

export type ProjectForEdit = Project & { images: ProjectImage[] };

export async function getProjectForEdit(id: string): Promise<ProjectForEdit | null> {
  const supabase = await db();

  const { data, error } = await supabase
    .from("projects")
    .select(`${PROJECT_COLUMNS}, project_images (${IMAGE_COLUMNS})`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat project: ${error.message}`);
  if (!data) return null;

  const project = data as unknown as Project & { project_images: ProjectImage[] };
  const images = [...(project.project_images ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );

  return { ...project, project_images: undefined, images } as ProjectForEdit;
}

export type HeroCandidate = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  coverUrl: string | null;
  coverThumbUrl: string | null;
};

/** Published projects that have a cover — the only ones allowed into the hero. */
export async function listHeroCandidates(): Promise<HeroCandidate[]> {
  const supabase = await db();

  const [{ data: projects, error }, { data: covers }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, slug, title, category")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase.from("project_images").select("id, project_id, url, thumb_url, is_cover").eq("is_cover", true),
  ]);

  if (error) throw new Error(`Gagal memuat kandidat hero: ${error.message}`);

  const coverByProject = new Map<string, ImageLite>();
  for (const cover of covers ?? []) {
    coverByProject.set(cover.project_id, cover);
  }

  return (projects ?? []).map((project) => {
    const cover = coverByProject.get(project.id);
    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      category: project.category,
      coverUrl: cover?.url ?? null,
      coverThumbUrl: cover?.thumb_url ?? cover?.url ?? null,
    };
  });
}

/** Current hero slots, including projects that have since become ineligible. */
export async function getHeroSlotsAdmin(): Promise<HeroCandidate[]> {
  const supabase = await db();

  const { data, error } = await supabase
    .from("hero_items")
    .select(`position, projects ( id, slug, title, category, published )`)
    .order("position", { ascending: true });

  if (error) throw new Error(`Gagal memuat hero: ${error.message}`);

  const candidates = await listHeroCandidates();
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  const slots: HeroCandidate[] = [];
  for (const row of data ?? []) {
    const project = row.projects as unknown as {
      id: string;
      slug: string;
      title: string;
      category: string | null;
    } | null;
    if (!project) continue;
    slots.push(byId.get(project.id) ?? { ...project, coverUrl: null, coverThumbUrl: null });
  }

  return slots;
}

export async function countUnreadMessages(): Promise<number> {
  const supabase = await db();

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw new Error(`Gagal menghitung pesan: ${error.message}`);
  return count ?? 0;
}

export type AdminSummary = {
  projects: number;
  published: number;
  missingCover: number;
  heroCount: number;
  services: number;
  unreadMessages: number;
  whatsappNumber: string | null;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const supabase = await db();

  const [projects, published, services, unreadMessages, heroCount, settings] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("hero_items").select("id", { count: "exact", head: true }),
    supabase.from("site_settings").select("whatsapp_number").eq("id", 1).maybeSingle(),
  ]);

  for (const [table, result] of [
    ["projects", projects],
    ["project published", published],
    ["services", services],
    ["messages", unreadMessages],
    ["hero_items", heroCount],
  ] as const) {
    if (result.error) throw new Error(`Gagal menghitung ${table}: ${result.error.message}`);
  }

  const { data: publishedRows, error: listError } = await supabase
    .from("projects")
    .select("id")
    .eq("published", true);
  if (listError) throw new Error(`Gagal memuat project: ${listError.message}`);

  const { data: coverRows, error: coverError } = await supabase
    .from("project_images")
    .select("project_id")
    .eq("is_cover", true);
  if (coverError) throw new Error(`Gagal memuat foto utama: ${coverError.message}`);

  const withCover = new Set((coverRows ?? []).map((row) => row.project_id));
  const missingCover = (publishedRows ?? []).filter((row) => !withCover.has(row.id)).length;

  return {
    projects: projects.count ?? 0,
    published: published.count ?? 0,
    missingCover,
    heroCount: heroCount.count ?? 0,
    services: services.count ?? 0,
    unreadMessages: unreadMessages.count ?? 0,
    whatsappNumber: settings.error ? null : readWhatsAppNumber(settings.data?.whatsapp_number),
  };
}

export async function listMessages(unreadOnly = false): Promise<Message[]> {
  const supabase = await db();

  let query = supabase.from("messages").select("*").order("created_at", { ascending: false });
  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) throw new Error(`Gagal memuat pesan: ${error.message}`);
  return data ?? [];
}

export async function getMessage(id: string): Promise<Message | null> {
  const supabase = await db();

  const { data, error } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Gagal memuat pesan: ${error.message}`);
  return data;
}

/** Opening a message marks it read, so this runs from the page rather than an effect. */
export async function markMessageRead(id: string): Promise<void> {
  const supabase = await db();

  const { error } = await supabase.from("messages").update({ is_read: true }).eq("id", id);
  if (error) throw new Error(`Gagal menandai pesan: ${error.message}`);
}

export async function listServicesAdmin(): Promise<AdminServiceRow[]> {
  const graph = await readServiceGraph(await db(), false);
  return buildAdminServices(graph);
}

/** A package for the edit screen, including the categories it belongs to. */
export async function getServiceForEdit(id: string): Promise<AdminServiceRow | null> {
  const graph = await readServiceGraph(await db(), false);
  return buildAdminServices(graph).find((service) => service.id === id) ?? null;
}

export async function listServiceCategoriesAdmin(): Promise<ServiceCategoryOption[]> {
  const supabase = await db();

  const { data, error } = await supabase
    .from("service_categories")
    .select("slug, name")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  return data ?? [];
}

export async function getSiteSettings(): Promise<AboutContent> {
  const supabase = await db();

  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Gagal memuat pengaturan situs: ${error.message}`);

  return {
    name: data?.about_name ?? null,
    role: data?.about_role ?? null,
    bio: data?.about_bio ?? null,
    photoUrl: data?.about_photo_url ?? null,
    socialLinks: parseSocialLinks(data?.social_links),
    whatsappNumber: data?.whatsapp_number ?? null,
  };
}
