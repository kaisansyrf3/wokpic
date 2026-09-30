"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  redirectTo: string;
  reason: string | null;
};

const REASONS: Record<string, string> = {
  notadmin: "Akun ini tidak punya hak akses admin.",
  config: "Pengaturan server belum lengkap. Periksa variabel env Supabase.",
  expired: "Sesi berakhir. Silakan masuk kembali.",
};

export function LoginForm({ redirectTo, reason }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    reason ? (REASONS[reason] ?? "Masuk gagal. Periksa kembali email dan kata sandi Anda.") : null,
  );
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : signInError.message,
      );
      setPending(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="ui-label text-ash">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="admin-input"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="ui-label text-ash">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="admin-input"
        />
      </div>

      {error ? (
        <p role="alert" className="border-l-2 border-red-400/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="admin-button admin-button-primary w-full">
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
