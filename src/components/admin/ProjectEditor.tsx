"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { Sortable, SortableItem } from "@/components/admin/Sortable";
import {
  deleteImage,
  reorderImages,
  setCoverImage,
  updateProject,
} from "@/app/admin/(panel)/projects/actions";
import { projectCategories } from "@/config/site";
import { slugify } from "@/lib/utils";

type ImageRow = {
  id: string;
  url: string;
  thumb_url: string | null;
  width: number | null;
  height: number | null;
  is_cover: boolean;
  sort_order: number;
};

type ProjectData = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  published: boolean;
};

export function ProjectEditor({
  project,
  images,
  publicUrl,
}: {
  project: ProjectData;
  images: ImageRow[];
  publicUrl: string | null;
}) {
  const router = useRouter();
  const { flash, run } = useFlash();

  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(true);
  const [category, setCategory] = useState(project.category ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [published, setPublished] = useState(project.published);
  const [savingMeta, setSavingMeta] = useState(false);

  const [orderOverride, setOrderOverride] = useState<{ key: string; ids: string[] } | null>(null);
  const [toDelete, setToDelete] = useState<ImageRow | null>(null);
  const [busy, setBusy] = useState(false);

  const serverIds = images.map((image) => image.id);
  const serverKey = serverIds.join(",");

  // The dragged order only applies until the server confirms it, then the
  // server list becomes the source of truth again.
  const orderedIds =
    orderOverride && orderOverride.key === serverKey ? orderOverride.ids : serverIds;

  const byId = new Map(images.map((image) => [image.id, image]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as ImageRow[];
  const cover = images.find((image) => image.is_cover) ?? null;
  const dirty =
    title !== project.title ||
    slug !== project.slug ||
    category !== (project.category ?? "") ||
    description !== (project.description ?? "") ||
    published !== project.published;

  const saveMeta = async () => {
    setSavingMeta(true);
    await run(
      updateProject(project.id, {
        title: title.trim(),
        slug: slugify(slug),
        category: category || null,
        description: description.trim() || null,
        published,
      }),
    );
    setSavingMeta(false);
    router.refresh();
  };

  const reorder = async (ids: string[]) => {
    setOrderOverride({ key: serverKey, ids });
    const ok = await run(reorderImages(project.id, ids));
    if (ok) router.refresh();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    await run(deleteImage(toDelete.id));
    setBusy(false);
    setToDelete(null);
    router.refresh();
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/projects" className="ui-label text-ash hover:text-chalk">
            &larr; Semua project
          </Link>
          <h1 className="mt-2 truncate text-xl font-light uppercase tracking-[0.2em]">
            {project.title}
          </h1>
        </div>
        {publicUrl ? (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="admin-button">
            Lihat halaman
          </a>
        ) : (
          <span className="admin-button pointer-events-none opacity-40">Belum tayang</span>
        )}
      </header>

      <FlashMessage flash={flash} />

      <section className="admin-card space-y-4 p-5">
        <p className="admin-heading">Informasi</p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Judul</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
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
          </label>

          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Kategori</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="admin-input"
            >
              <option value="">Tanpa kategori</option>
              {projectCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 md:col-span-2">
            <span className="ui-label text-ash">Deskripsi</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="admin-input"
              placeholder="Opsional. Tidak tampil di halaman viewer."
            />
          </label>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            className="h-4 w-4 accent-white"
          />
          <span className="text-sm">Tayang di situs</span>
        </label>

        {published && !cover ? (
          <p className="border-l-2 border-amber-400/70 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            Project ini belum punya foto utama, jadi tidak bisa ditayangkan.
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveMeta}
            disabled={savingMeta || !dirty || !title.trim() || !slug.trim()}
            className="admin-button admin-button-primary"
          >
            {savingMeta ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="admin-heading">Foto ({images.length})</p>
          <PhotoUploader projectId={project.id} onUploaded={() => router.refresh()} />
        </div>

        {ordered.length === 0 ? (
          <p className="admin-card px-5 py-10 text-center text-sm text-ash">
            Belum ada foto. Unggah beberapa untuk mulai.
          </p>
        ) : (
          <Sortable
            ids={ordered.map((image) => image.id)}
            onReorder={reorder}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {ordered.map((image, index) => (
              <SortableItem key={image.id} id={image.id} className="admin-card relative">
                <div className="relative aspect-4/3 w-full overflow-hidden">
                  <Image
                    src={image.thumb_url ?? image.url}
                    alt={`Foto ${index + 1}`}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                  {image.is_cover ? (
                    <span className="absolute left-2 top-2 border border-chalk bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
                      Utama
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-line px-2 py-2 pr-16">
                  <button
                    type="button"
                    onClick={async () => {
                      await run(setCoverImage(image.id));
                      router.refresh();
                    }}
                    disabled={image.is_cover}
                    className="ui-label text-ash hover:text-chalk disabled:opacity-40"
                  >
                    {image.is_cover ? "Foto utama" : "Jadikan utama"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(image)}
                    className="ui-label text-red-300 hover:text-red-200"
                  >
                    Hapus
                  </button>
                </div>
              </SortableItem>
            ))}
          </Sortable>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        busy={busy}
        title="Hapus foto ini?"
        description="Berkasnya ikut dihapus dari penyimpanan. Tindakan ini tidak bisa dibatalkan."
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
