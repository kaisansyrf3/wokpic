import Link from "next/link";

import { getAdminSummary } from "@/lib/supabase/admin-queries";

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();

  const warnings: Array<{ text: string; href: string; cta: string }> = [];

  if (summary.heroCount !== 8) {
    warnings.push({
      text: `Hero berisi ${summary.heroCount} project. Halaman utama butuh tepat 8 agar lingkaran foto tampil sempurna.`,
      href: "/admin/hero",
      cta: "Atur hero",
    });
  }

  if (summary.missingCover > 0) {
    warnings.push({
      text: `${summary.missingCover} project yang sudah tayang belum punya foto utama, sehingga tidak bisa masuk hero.`,
      href: "/admin/projects",
      cta: "Periksa project",
    });
  }

  if (!summary.whatsappNumber) {
    warnings.push({
      text: "Nomor WhatsApp belum diisi, tombol PILIH PAKET masih mengarah ke halaman Kontak.",
      href: "/admin/about",
      cta: "Isi nomor",
    });
  }

  const stats = [
    { label: "Project", value: summary.projects, href: "/admin/projects" },
    { label: "Tayang", value: summary.published, href: "/admin/projects" },
    { label: "Slot hero", value: `${summary.heroCount}/8`, href: "/admin/hero" },
    { label: "Paket", value: summary.services, href: "/admin/services" },
    { label: "Pesan belum dibaca", value: summary.unreadMessages, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-xl font-light uppercase tracking-[0.2em]">Ringkasan</h1>
        <p className="mt-1 text-sm text-ash">
          Kelola portofolio, susunan halaman utama, paket jasa, dan pesan dari formulir kontak.
        </p>
      </header>

      {warnings.length > 0 ? (
        <ul className="space-y-2">
          {warnings.map((warning) => (
            <li
              key={warning.href}
              className="admin-card flex flex-wrap items-center justify-between gap-3 border-amber-400/30 bg-amber-400/5 px-4 py-3"
            >
              <span className="text-sm text-amber-100">{warning.text}</span>
              <Link href={warning.href} className="admin-button">
                {warning.cta}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-ink-soft px-4 py-5 hover:bg-white/5">
            <dt className="admin-heading">{stat.label}</dt>
            <dd className="mt-2 text-2xl font-light">{stat.value}</dd>
          </Link>
        ))}
      </dl>
    </div>
  );
}
