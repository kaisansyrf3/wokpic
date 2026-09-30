"use server";

import { revalidatePath } from "next/cache";

import { SESSION_EXPIRED, getAdminUser, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { imagePayloadListSchema, imageOrderSchema, projectSchema } from "@/lib/validation";

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

function revalidatePublicSite() {
  revalidatePath("/");
  revalidatePath("/works/[slug]", "page");
}

export type ProjectDraft = {
  title: string;
  slug: string;
  category: string | null;
  description: string | null;
  published: boolean;
};

async function guard() {
  return (await getAdminUser()) !== null;
}

async function slugTaken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const { data } = await supabase.from("projects").select("id").eq("slug", slug).limit(1);
  return (data ?? []).some((row) => row.id !== exceptId);
}

export async function createProject(
  draft: ProjectDraft,
): Promise<ActionResult<{ id: string }>> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = projectSchema.safeParse(draft);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug)) {
    return { ok: false, message: "Slug sudah dipakai project lain." };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      category: parsed.data.category ?? null,
      description: parsed.data.description ?? null,
      published: false,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Slug sudah dipakai project lain."
          : `Gagal membuat project: ${error.message}`,
    };
  }

  return { ok: true, message: "Project dibuat. Silakan unggah fotonya.", data: { id: data.id } };
}

export async function updateProject(
  id: string,
  draft: ProjectDraft,
): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = projectSchema.safeParse(draft);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug, id)) {
    return { ok: false, message: "Slug sudah dipakai project lain." };
  }

  if (parsed.data.published) {
    const { count } = await supabase
      .from("project_images")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("is_cover", true);

    if (!count) {
      return {
        ok: false,
        message: "Project belum punya foto utama, jadi belum bisa ditayangkan.",
      };
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      category: parsed.data.category ?? null,
      description: parsed.data.description ?? null,
      published: parsed.data.published,
    })
    .eq("id", id);

  if (error) return { ok: false, message: `Gagal menyimpan: ${error.message}` };

  revalidatePublicSite();
  return { ok: true, message: "Perubahan tersimpan." };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const supabase = await createClient();

  // Best effort: files are cheap to leave behind, rows are not.
  const { data: objects } = await supabase.storage.from("portfolio").list(id);
  if (objects?.length) {
    await supabase.storage.from("portfolio").remove(
      objects.map((object) => `${id}/${object.name}`),
    );
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, message: `Gagal menghapus: ${error.message}` };

  revalidatePublicSite();
  return { ok: true, message: "Project dihapus." };
}

/** The browser uploads to Storage; this records the rows it produced. */
export async function recordImages(
  projectId: string,
  images: unknown,
): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = imagePayloadListSchema.safeParse({ projectId, images });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) return { ok: false, message: "Project tidak ditemukan." };

  const { data: existing } = await supabase
    .from("project_images")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = parsed.data.images.map((image) => ({
    project_id: projectId,
    url: image.url,
    thumb_url: image.thumbUrl,
    width: image.width,
    height: image.height,
    blur_data_url: image.blurDataUrl ?? null,
    sort_order: nextOrder++,
  }));

  const { error } = await supabase.from("project_images").insert(rows);
  if (error) return { ok: false, message: `Gagal menyimpan foto: ${error.message}` };

  revalidatePublicSite();
  return { ok: true, message: `${rows.length} foto ditambahkan.` };
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const supabase = await createClient();

  const { data: image } = await supabase
    .from("project_images")
    .select("id, url, thumb_url")
    .eq("id", imageId)
    .maybeSingle();

  if (!image) return { ok: false, message: "Foto tidak ditemukan." };

  const paths = [image.url, image.thumb_url]
    .filter((value): value is string => Boolean(value))
    .map(publicUrlFrom)
    .filter((path): path is string => Boolean(path));

  if (paths.length) {
    await supabase.storage.from("portfolio").remove(paths);
  }

  const { error } = await supabase.from("project_images").delete().eq("id", imageId);
  if (error) return { ok: false, message: `Gagal menghapus foto: ${error.message}` };

  revalidatePublicSite();
  return { ok: true, message: "Foto dihapus." };
}

export async function setCoverImage(imageId: string): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_project_cover", { image_id: imageId });
  if (error) return { ok: false, message: `Gagal menetapkan foto utama: ${error.message}` };

  revalidatePublicSite();
  return { ok: true, message: "Foto utama diperbarui." };
}

export async function reorderImages(
  projectId: string,
  imageIds: unknown,
): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = imageOrderSchema.safeParse({ projectId, imageIds });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_project_image_order", {
    target_project_id: parsed.data.projectId,
    image_ids: parsed.data.imageIds,
  });

  if (error) return { ok: false, message: `Gagal menyimpan urutan: ${error.message}` };

  revalidatePublicSite();
  return { ok: true, message: "Urutan foto tersimpan." };
}

/** Turns a public storage URL back into the object path inside the bucket. */
function publicUrlFrom(url: string): string | null {
  const marker = "/object/public/portfolio/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}
