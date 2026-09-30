import type { Metadata } from "next";

import { ContactForm } from "@/app/(site)/contact/ContactForm";
import { Reveal } from "@/components/ui/Reveal";
import { getActiveServices } from "@/lib/supabase/queries";

// Nodemailer only runs on the Node.js runtime, and the segment owns that choice.
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Ceritakan rencana acara Anda. Balasan biasanya datang dalam 1-2 hari kerja lewat email atau WhatsApp.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [{ service }, services] = await Promise.all([searchParams, getActiveServices()]);

  // A ?service= slug that no longer exists is ignored rather than an error.
  const selected = services.find((entry) => entry.slug === service)?.slug ?? "";

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
      <Reveal className="space-y-4 py-14 md:py-20">
        <p data-reveal className="ui-label text-ash">
          Kontak
        </p>
        <h1 data-reveal className="text-3xl font-light uppercase tracking-[0.14em] md:text-4xl">
          Mari obrolkan harimu
        </h1>
        <p data-reveal className="max-w-xl text-sm text-ash md:text-base">
          Isi formulir di bawah. Tidak ada biaya atau kewajiban sampai kita bicara langsung.
        </p>
      </Reveal>

      <Reveal>
        <div data-reveal className="border border-line bg-ink-soft/40 p-6 md:p-10">
          <ContactForm
            services={services.map((service) => ({ slug: service.slug, name: service.name }))}
            initialService={selected}
          />
        </div>
      </Reveal>
    </div>
  );
}
