"use server";

import { revalidatePath } from "next/cache";

import { SESSION_EXPIRED, getAdminUser, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { aboutSchema, type AboutInput } from "@/lib/validation";

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

/** The footer carries the social links, so the landing page must refresh too. */
function revalidateAboutPages() {
  revalidatePath("/about");
  revalidatePath("/");
}

function siteObjectPath(url: string | null): string | null {
  if (!url) return null;
  const marker = "/object/public/site/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

export async function saveAbout(draft: AboutInput): Promise<ActionResult> {
  if (!(await getAdminUser())) return SESSION_EXPIRED;

  const parsed = aboutSchema.safeParse({
    ...draft,
    social_links: draft.social_links.filter((link) => link.url.trim()),
  });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("site_settings")
    .select("about_photo_url")
    .eq("id", 1)
    .maybeSingle();

  const { error } = await supabase
    .from("site_settings")
    .update({
      about_name: parsed.data.about_name ?? null,
      about_role: parsed.data.about_role ?? null,
      about_bio: parsed.data.about_bio ?? null,
      about_photo_url: parsed.data.about_photo_url ?? null,
      social_links: parsed.data.social_links,
    })
    .eq("id", 1);

  if (error) return { ok: false, message: `Gagal menyimpan: ${error.message}` };

  const previous = siteObjectPath(current?.about_photo_url ?? null);
  const next = siteObjectPath(parsed.data.about_photo_url ?? null);
  if (previous && previous !== next) {
    await supabase.storage.from("site").remove([previous]);
  }

  revalidateAboutPages();
  return { ok: true, message: "Halaman About diperbarui." };
}

export async function deleteAboutPhoto(url: string): Promise<ActionResult> {
  if (!(await getAdminUser())) return SESSION_EXPIRED;

  const path = siteObjectPath(url);
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("site_settings")
    .update({ about_photo_url: null })
    .eq("id", 1);
  if (updateError) return { ok: false, message: `Gagal menghapus foto: ${updateError.message}` };

  if (path) await supabase.storage.from("site").remove([path]);

  revalidateAboutPages();
  return { ok: true, message: "Foto dihapus." };
}
