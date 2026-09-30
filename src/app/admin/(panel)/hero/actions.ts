"use server";

import { revalidatePath } from "next/cache";

import { SESSION_EXPIRED, getAdminUser, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { heroSchema } from "@/lib/validation";

/** The whole ring is replaced in one RPC so a half-saved hero is impossible. */
export async function saveHero(projectIds: unknown): Promise<ActionResult> {
  if (!(await getAdminUser())) return SESSION_EXPIRED;

  const parsed = heroSchema.safeParse({ projectIds });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_hero_items", {
    project_ids: parsed.data.projectIds,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Susunan halaman utama tersimpan." };
}
