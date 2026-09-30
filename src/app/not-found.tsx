import Link from "next/link";

import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="ui-label text-ash">404</p>
      <h1 className="max-w-md text-2xl font-light uppercase tracking-[0.14em]">
        Halaman ini tidak ditemukan
      </h1>
      <p className="max-w-sm text-sm text-ash">
        Cerita yang Anda cari mungkin sudah dipindahkan atau belum diterbitkan di {siteConfig.name}.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="ui-label border border-chalk bg-chalk px-6 py-3 uppercase tracking-widest text-ink"
        >
          Ke galeri
        </Link>
        <Link
          href="/contact"
          className="ui-label border border-line px-6 py-3 uppercase tracking-widest text-chalk transition-colors hover:border-chalk"
        >
          Hubungi kami
        </Link>
      </div>
    </main>
  );
}
