import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string };

export const SESSION_EXPIRED: ActionResult = {
  ok: false,
  message: "Sesi berakhir atau Anda bukan admin. Silakan masuk kembali.",
};

/** Returns the signed-in admin user, or null for anon and non-admin sessions. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.app_metadata?.role === "admin" ? user : null;
}

/** Page-level guard. Middleware already does this; this is the second layer. */
export async function requireAdminUser(nextPath = "/admin"): Promise<User> {
  const user = await getAdminUser();
  if (!user) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
