import type { Metadata } from "next";
import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { getAboutContent } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Tentang",
  description: `${siteConfig.name} — ${siteConfig.tagline}. Cerita singkat tentang cara kerja dan tautan media sosial.`,
};

export default async function AboutPage() {
  const about = await getAboutContent();

  const name = about.name?.trim() || siteConfig.name;
  const role = about.role?.trim() || "Fotografer pernikahan";
  const bio =
    about.bio?.trim() ||
    "Cerita tentang dua orang, direkam dengan cahaya dan kesabaran. Hasilnya adalah arsip yang tenang: wajah keluarga, gesture kecil, dan suasana yang tidak terulang.";

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 md:px-10">
      <Reveal className="grid gap-10 py-14 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:gap-14 md:py-20">
        <div data-reveal className="relative aspect-3/4 w-full overflow-hidden bg-ink-soft">
          {about.photoUrl ? (
            <Image
              src={about.photoUrl}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 88vw, 40vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs uppercase tracking-[0.22em] text-ash">
              Foto akan segera hadir
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div data-reveal className="space-y-2">
            <p className="ui-label text-ash">Tentang</p>
            <h1 className="text-3xl font-light uppercase tracking-[0.14em] md:text-4xl">{name}</h1>
            <p className="text-sm uppercase tracking-[0.18em] text-ash">{role}</p>
          </div>

          <p data-reveal className="max-w-xl text-sm leading-relaxed text-ash md:text-base">
            {bio}
          </p>

          {about.socialLinks.length > 0 ? (
            <nav data-reveal className="flex flex-wrap gap-x-7 gap-y-3" aria-label="Media sosial">
              {about.socialLinks.map((link) => (
                <a
                  key={`${link.platform}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-label text-chalk/70 transition-colors hover:text-chalk"
                >
                  {link.platform}
                </a>
              ))}
            </nav>
          ) : (
            <p data-reveal className="ui-label text-ash">
              Tautan media sosial belum diisi.
            </p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
