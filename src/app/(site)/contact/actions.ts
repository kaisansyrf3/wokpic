"use server";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendContactEmail } from "@/lib/email";
import { contactSchema, type ContactInput } from "@/lib/validation";

// `runtime = "nodejs"` is declared on the segment page: a "use server" file may
// only export async functions.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

export type ContactField = "name" | "email" | "phone" | "body";

/** Echoed back so React can restore the fields after a rejected submission. */
export type ContactValues = {
  name: string;
  email: string;
  phone: string;
  service: string;
  body: string;
};

export type ContactFormState = {
  ok: boolean;
  message: string;
  values: ContactValues;
  errors?: Partial<Record<ContactField, string>>;
};

const EMPTY: ContactValues = { name: "", email: "", phone: "", service: "", body: "" };

const SUCCESS: ContactFormState = {
  ok: true,
  message: "Terima kasih, pesan Anda sudah kami terima. Kami balas secepatnya lewat email atau WhatsApp.",
  values: EMPTY,
};

function fail(message: string, values: ContactValues, errors?: ContactFormState["errors"]): ContactFormState {
  return { ok: false, message, values, errors };
}

function fieldValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): ContactValues {
  return {
    name: fieldValue(formData, "name"),
    email: fieldValue(formData, "email"),
    phone: fieldValue(formData, "phone"),
    service: fieldValue(formData, "service"),
    body: fieldValue(formData, "body"),
  };
}

/** `x-forwarded-for` carries the visitor address behind every managed proxy. */
async function clientIp(): Promise<string | null> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headerList.get("x-real-ip");
}

export async function sendMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = readValues(formData);

  // A filled honeypot means a bot: answer as if it worked, store nothing.
  if (fieldValue(formData, "website").trim() !== "") return SUCCESS;

  const input: ContactInput = {
    name: values.name,
    email: values.email,
    phone: values.phone,
    service_slug: values.service,
    body: values.body,
  };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const errors: ContactFormState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "phone" || key === "body") {
        errors[key] ??= issue.message;
      }
    }
    return fail("Periksa kembali isian Anda.", values, errors);
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: rateError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("email", data.email)
    .gt("created_at", since);

  if (rateError) {
    console.error("[contact] gagal memeriksa batas pesan:", rateError.message);
    return fail("Pesan belum bisa dikirim. Coba lagi beberapa saat lagi.", values);
  }
  if ((count ?? 0) >= MAX_PER_WINDOW) {
    return fail("Terlalu banyak percobaan, coba lagi beberapa menit lagi.", values);
  }

  // The slug comes from the URL, so an unknown one simply means "no package".
  const serviceName = data.service_slug
    ? (
        await supabase
          .from("services")
          .select("name")
          .eq("slug", data.service_slug)
          .eq("is_active", true)
          .maybeSingle()
      ).data?.name ?? null
    : null;

  const ip = await clientIp();
  if (ip) {
    const { count: ipCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gt("created_at", since);
    if ((ipCount ?? 0) >= MAX_PER_WINDOW) {
      return fail("Terlalu banyak percobaan, coba lagi beberapa menit lagi.", values);
    }
  }

  const { data: stored, error: insertError } = await supabase
    .from("messages")
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      service_name: serviceName,
      body: data.body,
      ip,
    })
    .select("id, created_at")
    .single();

  if (insertError || !stored) {
    console.error("[contact] gagal menyimpan pesan:", insertError?.message);
    return fail(
      "Pesan belum tersimpan. Mohon coba lagi, atau hubungi kami lewat media sosial.",
      values,
    );
  }

  const result = await sendContactEmail({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    serviceName,
    body: data.body,
    createdAt: new Date(stored.created_at ?? Date.now()),
  });

  if (result.sent) {
    await supabase.from("messages").update({ email_sent: true }).eq("id", stored.id);
  }

  // Always success for the visitor: the message is stored and visible in admin
  // even when the owner's notification email failed.
  return SUCCESS;
}
