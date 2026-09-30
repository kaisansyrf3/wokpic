"use server";

import { revalidatePath } from "next/cache";

import { SESSION_EXPIRED, getAdminUser, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { serviceOrderSchema, serviceSchema, type ServiceInput } from "@/lib/validation";

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

/** `/service` renders the cards and `/contact` renders the dropdown from the same rows. */
function revalidateServicePages() {
  revalidatePath("/service");
  revalidatePath("/contact");
}

export type ServiceDraft = ServiceInput;

async function guard() {
  return (await getAdminUser()) !== null;
}

async function slugTaken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const { data } = await supabase.from("services").select("id").eq("slug", slug).limit(1);
  return (data ?? []).some((row) => row.id !== exceptId);
}

/** Drops blank rows the repeater may leave behind before validating. */
function cleanDraft(draft: ServiceDraft): ServiceDraft {
  return { ...draft, features: draft.features.map((feature) => feature.trim()).filter(Boolean) };
}

export async function createService(draft: ServiceDraft): Promise<ActionResult<{ id: string }>> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = serviceSchema.safeParse(cleanDraft(draft));
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug)) {
    return { ok: false, message: "Slug sudah dipakai paket lain." };
  }

  const { data: last } = await supabase
    .from("services")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const { data, error } = await supabase
    .from("services")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      tagline: parsed.data.tagline ?? null,
      price: parsed.data.price,
      features: parsed.data.features,
      is_active: parsed.data.is_active,
      sort_order: (last?.[0]?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Slug sudah dipakai paket lain."
          : `Gagal membuat paket: ${error.message}`,
    };
  }

  revalidateServicePages();
  return { ok: true, message: "Paket dibuat.", data: { id: data.id } };
}

export async function updateService(id: string, draft: ServiceDraft): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = serviceSchema.safeParse(cleanDraft(draft));
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug, id)) {
    return { ok: false, message: "Slug sudah dipakai paket lain." };
  }

  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      tagline: parsed.data.tagline ?? null,
      price: parsed.data.price,
      features: parsed.data.features,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);

  if (error) return { ok: false, message: `Gagal menyimpan: ${error.message}` };

  revalidateServicePages();
  return { ok: true, message: "Perubahan tersimpan." };
}

export async function deleteService(id: string): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { ok: false, message: `Gagal menghapus: ${error.message}` };

  revalidateServicePages();
  return {
    ok: true,
    message: "Paket dihapus. Pesan lama tetap menyimpan nama paketnya.",
  };
}

export async function reorderServices(serviceIds: unknown): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = serviceOrderSchema.safeParse({ serviceIds });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_service_order", {
    service_ids: parsed.data.serviceIds,
  });

  if (error) return { ok: false, message: `Gagal menyimpan urutan: ${error.message}` };

  revalidateServicePages();
  return { ok: true, message: "Urutan paket tersimpan." };
}
