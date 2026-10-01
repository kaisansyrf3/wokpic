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
  return {
    ...draft,
    features: draft.features.map((feature) => feature.trim()).filter(Boolean),
    categorySlugs: draft.categorySlugs.filter(Boolean),
  };
}

/** The RPC raises its own Indonesian messages, so those can be shown as they are. */
function storeError(error: { code: string; message: string }, fallback: string): string {
  if (error.code === "23505") return "Slug sudah dipakai paket lain.";
  if (error.code === "P0001") return error.message;
  return `${fallback}: ${error.message}`;
}

type SaveArgs = {
  target_id: string | null;
  service_slug: string;
  service_name: string;
  service_tagline: string | null;
  service_price: number;
  service_features: string[];
  service_is_active: boolean;
  category_slugs: string[];
};

function saveArgs(id: string | null, data: ServiceInput): SaveArgs {
  return {
    target_id: id,
    service_slug: data.slug,
    service_name: data.name,
    service_tagline: data.tagline ?? null,
    service_price: data.price,
    service_features: data.features,
    service_is_active: data.is_active,
    category_slugs: data.categorySlugs,
  };
}

/** One RPC stores the package and its category links, so nothing saves halfway. */
export async function createService(draft: ServiceDraft): Promise<ActionResult<{ id: string }>> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = serviceSchema.safeParse(cleanDraft(draft));
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug)) {
    return { ok: false, message: "Slug sudah dipakai paket lain." };
  }

  const { data, error } = await supabase.rpc("save_service", saveArgs(null, parsed.data));
  if (error) return { ok: false, message: storeError(error, "Gagal membuat paket") };

  revalidateServicePages();
  return { ok: true, message: "Paket dibuat.", data: { id: String(data) } };
}

export async function updateService(id: string, draft: ServiceDraft): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = serviceSchema.safeParse(cleanDraft(draft));
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug, id)) {
    return { ok: false, message: "Slug sudah dipakai paket lain." };
  }

  const { error } = await supabase.rpc("save_service", saveArgs(id, parsed.data));
  if (error) return { ok: false, message: storeError(error, "Gagal menyimpan") };

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

/** Reorders a package list inside one category only. */
export async function reorderServices(
  categorySlug: unknown,
  serviceIds: unknown,
): Promise<ActionResult> {
  if (!(await guard())) return SESSION_EXPIRED;

  const parsed = serviceOrderSchema.safeParse({ categorySlug, serviceIds });
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_service_category_order", {
    category_slug: parsed.data.categorySlug,
    service_ids: parsed.data.serviceIds,
  });

  if (error) return { ok: false, message: storeError(error, "Gagal menyimpan urutan") };

  revalidateServicePages();
  return { ok: true, message: "Urutan paket tersimpan." };
}
