"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { Sortable, SortableItem } from "@/components/admin/Sortable";
import { updateService, type ServiceDraft } from "@/app/admin/(panel)/services/actions";
import { formatRupiah } from "@/lib/format";
import { cn, slugify } from "@/lib/utils";

type FeatureRow = { id: string; text: string };

type Category = { slug: string; name: string };

type Service = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  features: string[];
  is_active: boolean;
};

function toRows(features: string[]): FeatureRow[] {
  return features.map((text, index) => ({ id: `f${index}`, text }));
}

export function ServiceEditor({
  service,
  categories,
  initialCategorySlugs,
  publicPath,
}: {
  service: Service;
  categories: Category[];
  initialCategorySlugs: string[];
  publicPath: string | null;
}) {
  const router = useRouter();
  const { flash, run } = useFlash();

  const [name, setName] = useState(service.name);
  const [slug, setSlug] = useState(service.slug);
  const [slugTouched, setSlugTouched] = useState(true);
  const [tagline, setTagline] = useState(service.tagline ?? "");
  const [price, setPrice] = useState(String(service.price));
  const [rows, setRows] = useState<FeatureRow[]>(() => toRows(service.features));
  const [isActive, setIsActive] = useState(service.is_active);
  const [categorySlugs, setCategorySlugs] = useState<string[]>(initialCategorySlugs);
  const [categoryError, setCategoryError] = useState(false);
  const [pending, setPending] = useState(false);

  const draft: ServiceDraft = {
    name: name.trim(),
    slug: slugify(slug || name),
    tagline: tagline.trim() || null,
    price: Number.parseInt(price, 10) || 0,
    features: rows.map((row) => row.text),
    is_active: isActive,
    categorySlugs,
  };

  const toggleCategory = (slugValue: string) => {
    setCategorySlugs((current) =>
      current.includes(slugValue)
        ? current.filter((entry) => entry !== slugValue)
        : [...current, slugValue],
    );
    setCategoryError(false);
  };

  const save = async () => {
    if (categorySlugs.length === 0) {
      setCategoryError(true);
      return;
    }
    setPending(true);
    await run(updateService(service.id, draft));
    setPending(false);
    router.refresh();
  };

  const addFeature = () => {
    setRows([...rows, { id: `n${Date.now()}${rows.length}`, text: "" }]);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/services" className="ui-label text-ash hover:text-chalk">
            ← Semua paket
          </Link>
          <h1 className="mt-2 text-xl font-light uppercase tracking-[0.2em]">{service.name}</h1>
        </div>
        {publicPath ? (
          <Link href={publicPath} className="admin-button" target="_blank" rel="noopener">
            Lihat di situs
          </Link>
        ) : (
          <span className="text-xs text-amber-200">Paket nonaktif tidak tampil di situs.</span>
        )}
      </header>

      <FlashMessage flash={flash} />

      <section className="admin-card space-y-4 p-5">
        <p className="admin-heading">Detail paket</p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Nama paket</span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              className="admin-input"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Slug</span>
            <input
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className="admin-input"
            />
            <span className="block text-xs text-ash">
              Dipakai tautan /contact?service={slug || "slug-paket"}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Tagline</span>
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              className="admin-input"
              placeholder="Satu hari penuh, tanpa tim kedua"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Harga (rupiah, tanpa pemisah)</span>
            <input
              value={price}
              inputMode="numeric"
              onChange={(event) => setPrice(event.target.value.replace(/[^\d]/g, ""))}
              className="admin-input"
              placeholder="5000000"
            />
            <span className="block text-xs text-ash">Pratinjau: {formatRupiah(draft.price)}</span>
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 accent-white"
          />
          Tampilkan paket ini di situs
        </label>

        <fieldset className="space-y-2 border-t border-line pt-4">
          <legend className="ui-label text-ash">Kategori</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const checked = categorySlugs.includes(category.slug);
              return (
                <label
                  key={category.slug}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm",
                    checked ? "border-chalk text-chalk" : "border-line text-ash",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category.slug)}
                    className="h-4 w-4 accent-white"
                  />
                  {category.name}
                </label>
              );
            })}
          </div>
          {categoryError ? (
            <p className="text-xs text-red-200">Pilih minimal satu kategori.</p>
          ) : (
            <p className="text-xs text-ash">
              Paket bisa tampil di lebih dari satu kategori. Mencentang kategori baru menempatkannya
              di urutan paling akhir kategori itu.
            </p>
          )}
        </fieldset>
      </section>

      <section className="admin-card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="admin-heading">Rincian jasa ({rows.length})</p>
          <button type="button" onClick={addFeature} className="admin-button">
            Tambah rincian
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-ash">
            Belum ada rincian. Pengunjung hanya akan melihat nama, tagline, dan harga.
          </p>
        ) : (
          <Sortable
            ids={rows.map((row) => row.id)}
            onReorder={(ids) => {
              const current = new Map(rows.map((row) => [row.id, row]));
              setRows(ids.map((id) => current.get(id)).filter((row): row is FeatureRow => Boolean(row)));
            }}
            className="space-y-2"
          >
            {rows.map((row, index) => (
              <SortableItem
                key={row.id}
                id={row.id}
                className="relative flex items-center gap-2 border border-line bg-ink py-1.5 pl-2 pr-16"
              >
                <span className="ui-label w-5 shrink-0 text-center text-ash">{index + 1}</span>
                <input
                  value={row.text}
                  onChange={(event) =>
                    setRows(
                      rows.map((entry) =>
                        entry.id === row.id ? { ...entry, text: event.target.value } : entry,
                      ),
                    )
                  }
                  className="admin-input border-0 bg-transparent"
                  placeholder="Fotografer utama"
                />
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((entry) => entry.id !== row.id))}
                  className="ui-label shrink-0 text-red-300 hover:text-red-200"
                >
                  Hapus
                </button>
              </SortableItem>
            ))}
          </Sortable>
        )}

        <p className="text-xs text-ash">
          Rincian yang kosong diabaikan saat disimpan. Urutan di sini adalah urutan tampil di kartu.
        </p>
      </section>

      <div className="flex justify-end gap-2">
        <Link href="/admin/services" className="admin-button">
          Kembali
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={pending || !draft.name || !draft.slug}
          className="admin-button admin-button-primary"
        >
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </div>
  );
}
