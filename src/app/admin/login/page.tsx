import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/LoginForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Masuk Admin - ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ reason?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason, next } = await searchParams;

  // Only ever send the user back to somewhere inside /admin.
  const redirectTo = next && next.startsWith("/admin") ? next : "/admin";

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="ui-label mb-8 text-center text-chalk">{siteConfig.name}</p>
        <h1 className="mb-1 text-lg font-light tracking-[0.2em] uppercase">Masuk Admin</h1>
        <p className="mb-6 text-sm text-ash">
          Area pribadi untuk mengelola portofolio, paket, dan pesan masuk.
        </p>
        <LoginForm redirectTo={redirectTo} reason={reason ?? null} />
      </div>
    </main>
  );
}
