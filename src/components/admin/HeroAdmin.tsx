"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveHero } from "@/app/admin/(panel)/hero/actions";
import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { RingPreview, type PreviewItem } from "@/components/admin/RingPreview";
import { Sortable, SortableItem } from "@/components/admin/Sortable";

const HERO_SLOTS = 8;

type Candidate = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  coverUrl: string | null;
  coverThumbUrl: string | null;
};

export function HeroAdmin({
  candidates,
  initialSlots,
}: {
  candidates: Candidate[];
  initialSlots: Candidate[];
}) {
  const router = useRouter();
  const { flash, run } = useFlash();

  const [slots, setSlots] = useState<Candidate[]>(initialSlots);
  const [saving, setSaving] = useState(false);

  const available = candidates.filter(
    (candidate) => !slots.some((slot) => slot.id === candidate.id),
  );

  const previewItems: PreviewItem[] = slots.map((slot) => ({
    id: slot.id,
    title: slot.title,
    thumbUrl: slot.coverThumbUrl,
  }));

  const add = (candidate: Candidate) => {
    if (slots.length >= HERO_SLOTS) return;
    setSlots([...slots, candidate]);
  };

  const remove = (id: string) => setSlots(slots.filter((slot) => slot.id !== id));

  const reorder = (ids: string[]) => {
    const current = new Map(slots.map((slot) => [slot.id, slot]));
    setSlots(
      ids.map((id) => current.get(id)).filter((slot): slot is Candidate => Boolean(slot)),
    );
  };

  const save = async () => {
    setSaving(true);
    const ok = await run(saveHero(slots.map((slot) => slot.id)));
    setSaving(false);
    if (ok) router.refresh();
  };

  const complete = slots.length === HERO_SLOTS;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-light uppercase tracking-[0.2em]">Hero</h1>
        <p className="mt-1 text-sm text-ash">
          Delapan project yang melingkari teks ajakan di halaman utama. Urutan menentukan posisinya,
          dimulai dari jam 12 lalu searah jarum jam.
        </p>
      </header>

      <FlashMessage flash={flash} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="admin-card p-5">
          <p className="admin-heading mb-3">
            Tersedia ({available.length})
          </p>
          {available.length === 0 ? (
            <p className="text-sm text-ash">
              Semua project yang layak sudah masuk hero. Project harus tayang dan punya foto utama.
            </p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {available.map((candidate) => (
                <li
                  key={candidate.id}
                  className="flex items-center gap-3 border border-line px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{candidate.title}</span>
                    <span className="ui-label block truncate text-ash">
                      {candidate.category ?? "tanpa kategori"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => add(candidate)}
                    disabled={slots.length >= HERO_SLOTS}
                    className="admin-button"
                  >
                    Tambah
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="admin-heading">
              Hero ({slots.length}/{HERO_SLOTS})
            </p>
            {!complete ? (
              <span className="text-xs text-amber-200">Butuh tepat 8 project</span>
            ) : null}
          </div>

          {slots.length === 0 ? (
            <p className="text-sm text-ash">Belum ada project di hero.</p>
          ) : (
            <Sortable
              ids={slots.map((slot) => slot.id)}
              onReorder={reorder}
              className="space-y-2"
            >
              {slots.map((slot, index) => (
                <SortableItem
                  key={slot.id}
                  id={slot.id}
                  className="relative flex items-center gap-3 border border-line bg-ink px-3 py-2 pr-16"
                >
                  <span className="ui-label w-6 shrink-0 text-ash">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{slot.title}</span>
                    <span className="ui-label block truncate text-ash">/{slot.slug}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(slot.id)}
                    className="ui-label text-red-300 hover:text-red-200"
                  >
                    Keluar
                  </button>
                </SortableItem>
              ))}
            </Sortable>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={!complete || saving}
              className="admin-button admin-button-primary"
            >
              {saving ? "Menyimpan…" : "Simpan susunan"}
            </button>
          </div>
        </section>
      </div>

      <section className="admin-card p-5">
        <p className="admin-heading mb-4">Pratinjau lingkaran</p>
        <RingPreview items={previewItems} />
      </section>

      {slots.length > 0 ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {slots.map((slot, index) => (
            <li key={slot.id} className="space-y-1">
              <div className="relative aspect-4/3 w-full overflow-hidden border border-line bg-ink-soft">
                {slot.coverThumbUrl ? (
                  <Image
                    src={slot.coverThumbUrl}
                    alt={slot.title}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <p className="ui-label text-center text-ash">{index + 1}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
