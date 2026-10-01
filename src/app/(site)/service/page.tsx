import type { Metadata } from "next";

import { Reveal } from "@/components/ui/Reveal";
import { ServiceBrowser } from "@/components/service/ServiceBrowser";
import { getServiceCatalog, getWhatsAppNumber } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Layanan",
  description:
    "Paket fotografi pernikahan, prewedding, dan graduation: cakupan, rincian jasa, dan harga mulai. Pilih paket lalu lanjut ke WhatsApp.",
};

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, catalog, whatsappNumber] = await Promise.all([
    searchParams,
    getServiceCatalog(),
    getWhatsAppNumber(),
  ]);

  // An unknown ?category= falls back to the first tab rather than erroring.
  const requested = catalog.categories.find((entry) => entry.slug === category);
  const initialCategory = requested?.slug ?? catalog.categories[0]?.slug ?? "";

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

      {catalog.services.length === 0 || catalog.categories.length === 0 ? (
        <p className="border border-line bg-ink-soft/40 px-6 py-14 text-center text-sm text-ash">
          Daftar paket sedang disiapkan. Silakan hubungi kami lewat halaman Contact untuk penawaran
          khusus.
        </p>
      ) : (
        <ServiceBrowser
          categories={catalog.categories}
          services={catalog.services.map((service) => ({
            id: service.id,
            slug: service.slug,
            name: service.name,
            tagline: service.tagline,
            price: service.price,
            features: service.features,
          }))}
          serviceIdsByCategory={catalog.serviceIdsByCategory}
          initialCategory={initialCategory}
          whatsappNumber={whatsappNumber}
        />
      )}
    </div>
  );
}
