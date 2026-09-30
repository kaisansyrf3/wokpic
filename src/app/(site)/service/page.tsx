import type { Metadata } from "next";

import { Reveal } from "@/components/ui/Reveal";
import { ServiceCard } from "@/components/service/ServiceCard";
import { getActiveServices } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Layanan",
  description:
    "Paket fotografi pernikahan: cakupan, rincian jasa, dan harga mulai. Pilih paket lalu lanjut ke formulir kontak.",
};

export default async function ServicePage() {
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 md:px-10">
      <Reveal className="space-y-4 py-14 md:py-20">
        <p data-reveal className="ui-label text-ash">
          Layanan
        </p>
        <h1 data-reveal className="max-w-2xl text-3xl font-light uppercase tracking-[0.14em] md:text-4xl">
          Paket yang sederhana dan jelas
        </h1>
        <p data-reveal className="max-w-xl text-sm text-ash md:text-base">
          Setiap paket mencakup satu fotografer utama, penyuntingan penuh, dan galeri daring. Rincian
          lengkapnya ada di tiap kartu.
        </p>
      </Reveal>

      {services.length === 0 ? (
        <p className="border border-line bg-ink-soft/40 px-6 py-14 text-center text-sm text-ash">
          Daftar paket sedang disiapkan. Silakan hubungi kami lewat halaman Contact untuk penawaran
          khusus.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
