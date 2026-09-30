"use server";

import { revalidatePath } from "next/cache";

import { SESSION_EXPIRED, getAdminUser, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidateInbox() {
  // The sidebar badge lives in the panel layout.
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  if (!(await getAdminUser())) return SESSION_EXPIRED;

  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ is_read: read })
    .eq("id", id);

  if (error) return { ok: false, message: `Gagal memperbarui: ${error.message}` };

  revalidateInbox();
  return { ok: true, message: read ? "Ditandai sudah dibaca." : "Ditandai belum dibaca." };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  if (!(await getAdminUser())) return SESSION_EXPIRED;

  const supabase = await createClient();

  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) return { ok: false, message: `Gagal menghapus: ${error.message}` };

  revalidateInbox();
  return { ok: true, message: "Pesan dihapus." };
}
