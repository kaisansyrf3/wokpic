"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { Sortable, SortableItem } from "@/components/admin/Sortable";
import {
  createService,
  deleteService,
  reorderServices,
} from "@/app/admin/(panel)/services/actions";
import { formatRupiah } from "@/lib/format";
import { cn, slugify } from "@/lib/utils";

type Category = { slug: string; name: string };

type Placement = { slug: string; name: string; sortOrder: number };

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  features: string[];
  is_active: boolean;
  placements: Placement[];
};

const ALL_TAB = "all";

export function ServicesAdmin({
  services,
  categories,
}: {
  services: ServiceRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const { flash, run } = useFlash();

  const [tab, setTab] = useState<string>(ALL_TAB);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState("");
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [pending, setPending] = useState(false);
  const [toDelete, setToDelete] = useState<ServiceRow | null>(null);

  const inCategory = tab !== ALL_TAB;

  /** Only a category tab has its own order; "Semua" is read-only. */
  const rowsForTab = inCategory
    ? [...services]
        .filter((service) => service.placements.some((p) => p.slug === tab))
        .sort((a, b) => {
          const orderA = a.placements.find((p) => p.slug === tab)?.sortOrder ?? 0;
          const orderB = b.placements.find((p) => p.slug === tab)?.sortOrder ?? 0;
          return orderA - orderB;
        })
    : services;

  const serverIds = rowsForTab.map((service) => service.id);
  const serverKey = `${tab}:${serverIds.join(",")}`;

  // A dragged order only applies until the server confirms it.
  const [orderOverride, setOrderOverride] = useState<{ key: string; ids: string[] } | null>(null);
  const orderedIds = orderOverride && orderOverride.key === serverKey ? orderOverride.ids : serverIds;

  const byId = new Map(services.map((service) => [service.id, service]));
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((service): service is ServiceRow => Boolean(service));

  const activeCategoryName = categories.find((category) => category.slug === tab)?.name ?? null;

  const startCreate = () => {
    setCreating(true);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setPrice("");
    // Inside a category tab the new package starts in that category.
    setCategorySlugs(inCategory ? [tab] : []);
    setCategoryError(false);
  };

  const toggleCategory = (slugValue: string) => {
    setCategorySlugs((current) =>
      current.includes(slugValue)
        ? current.filter((entry) => entry !== slugValue)
        : [...current, slugValue],
    );
    setCategoryError(false);
  };

  const submitCreate = async () => {
    if (!name.trim()) return;
    if (categorySlugs.length === 0) {
      setCategoryError(true);
      return;
    }
    setPending(true);
    const ok = await run(
      createService({
        name: name.trim(),
        slug: slugify(slug || name),
        tagline: null,
        price: Number.parseInt(price.replace(/\D/g, ""), 10) || 0,
        features: [],
        is_active: true,
        categorySlugs,
      }),
      (data) => {
        router.push(`/admin/services/${(data as { id: string }).id}`);
      },
    );
    setPending(false);
    if (ok) setCreating(false);
  };

  const saveOrder = async (ids: string[]) => {
    if (!inCategory) return;
    setPending(true);
    await run(reorderServices(tab, ids));
    setPending(false);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setPending(true);
    await run(deleteService(toDelete.id));
    setPending(false);
    setToDelete(null);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-light uppercase tracking-[0.2em]">Paket</h1>
          <p className="mt-1 text-sm text-ash">
            {services.length} paket
            {inCategory
              ? ` · urutan di tab ${activeCategoryName} hanya berlaku di kategori itu.`
              : " · satu paket bisa tampil di beberapa kategori sekaligus."}
          </p>
        </div>
        <button type="button" onClick={startCreate} className="admin-button admin-button-primary">
          Tambah paket
        </button>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-line">
        {[{ slug: ALL_TAB, name: "Semua" }, ...categories].map((entry) => {
          const isActive = entry.slug === tab;
          return (
            <button
              key={entry.slug}
              type="button"
              onClick={() => {
                setTab(entry.slug);
                setOrderOverride(null);
              }}
              className={cn(
                "ui-label min-h-11 cursor-pointer border-b-2 px-4 transition-colors",
                isActive
                  ? "border-chalk text-chalk"
                  : "border-transparent text-ash hover:text-chalk",
              )}
            >
              {entry.name}
            </button>
          );
        })}
      </div>

      <FlashMessage flash={flash} />

      {creating ? (
        <div className="admin-card space-y-4 p-5">
          <p className="admin-heading">Paket baru</p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="ui-label text-ash">Nama paket</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                }}
                className="admin-input"
                placeholder="Paket Akad"
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
                placeholder="paket-akad"
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
              <span className="block text-xs text-ash">
                Pratinjau: {formatRupiah(price ? Number(price) : 0)}
              </span>
            </label>
          </div>

          <fieldset className="space-y-2">
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
                Boleh lebih dari satu. Paket baru masuk ke urutan paling akhir di kategorinya.
              </p>
            )}
          </fieldset>

          <p className="text-xs text-ash">Tagline dan rincian jasa diisi setelah paket dibuat.</p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="admin-button">
              Batal
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={pending || !name.trim()}
              className="admin-button admin-button-primary"
            >
              {pending ? "Menyimpan…" : "Buat paket"}
            </button>
          </div>
        </div>
      ) : null}

      {services.length === 0 ? (
        <p className="admin-card px-5 py-10 text-center text-sm text-ash">
          Belum ada paket. Tambahkan satu paket agar halaman Service dan dropdown Contact terisi.
        </p>
      ) : ordered.length === 0 ? (
        <p className="admin-card px-5 py-10 text-center text-sm text-ash">
          Kategori {activeCategoryName} belum punya paket. Tambahkan paket atau centang kategori ini
          di paket yang sudah ada.
        </p>
      ) : inCategory ? (
        <>
          <Sortable
            ids={orderedIds}
            onReorder={(ids) => setOrderOverride({ key: serverKey, ids })}
            className="space-y-2"
          >
            {ordered.map((service, index) => (
              <ServiceLine
                key={service.id}
                service={service}
                index={index}
                onDelete={() => setToDelete(service)}
              />
            ))}
          </Sortable>

          {orderOverride && orderOverride.key === serverKey ? (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOrderOverride(null)} className="admin-button">
                Batal urutan
              </button>
              <button
                type="button"
                onClick={() => saveOrder(orderOverride.ids)}
                disabled={pending}
                className="admin-button admin-button-primary"
              >
                {pending ? "Menyimpan…" : "Simpan urutan"}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-2">
          {ordered.map((service, index) => (
            <ServiceLine
              key={service.id}
              service={service}
              index={index}
              draggable={false}
              onDelete={() => setToDelete(service)}
            />
          ))}
          <p className="text-xs text-ash">
            Pilih tab kategori untuk mengatur urutan. Urutan di satu kategori tidak mengubah
            kategori lain.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        busy={pending}
        title={`Hapus ${toDelete?.name ?? ""}?`}
        description={
          toDelete && toDelete.placements.length > 1
            ? `Paket ini juga tampil di ${toDelete.placements
                .map((placement) => placement.name)
                .join(" dan ")}. Menghapusnya melepas paket dari semua kategori sekaligus. Pesan lama dari pengunjung tetap aman karena nama paket disimpan sebagai salinan.`
            : "Paket akan hilang dari halaman Service dan dropdown Contact. Pesan lama dari pengunjung tetap aman karena nama paket disimpan sebagai salinan."
        }
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ServiceLine({
  service,
  index,
  onDelete,
  draggable = true,
}: {
  service: ServiceRow;
  index: number;
  onDelete: () => void;
  draggable?: boolean;
}) {
  const body = (
    <div className="flex flex-wrap items-center gap-3">
      <span className="ui-label w-6 shrink-0 text-ash">{String(index + 1).padStart(2, "0")}</span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm">{service.name}</span>
          <span
            className={
              service.is_active
                ? "border border-emerald-400/40 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-emerald-200"
                : "border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ash"
            }
          >
            {service.is_active ? "Aktif" : "Nonaktif"}
          </span>
          {service.placements.map((placement) => (
            <span
              key={placement.slug}
              className="border border-sky-400/30 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-sky-200"
            >
              {placement.name}
            </span>
          ))}
        </span>
        <span className="ui-label mt-1 block truncate text-ash">
          /{service.slug} · {service.features.length} rincian
        </span>
      </span>

      <span className="text-sm text-ash">{formatRupiah(service.price)}</span>

      <Link href={`/admin/services/${service.id}`} className="admin-button">
        Ubah
      </Link>
      <button type="button" onClick={onDelete} className="admin-button admin-button-danger">
        Hapus
      </button>
    </div>
  );

  if (!draggable) {
    return <div className="border border-line bg-ink px-4 py-3">{body}</div>;
  }

  return (
    <SortableItem
      id={service.id}
      className="relative border border-line bg-ink px-4 py-3 pr-20"
    >
      {body}
    </SortableItem>
  );
}
