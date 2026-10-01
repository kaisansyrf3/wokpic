"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { projectCategories } from "@/config/site";
import { createProject, deleteProject } from "@/app/admin/(panel)/projects/actions";
import { slugify } from "@/lib/utils";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  image_count: number;
  cover: { id: string; thumb_url: string | null; url: string } | null;
};

export function ProjectsAdmin({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const { flash, run } = useFlash();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [toDelete, setToDelete] = useState<ProjectRow | null>(null);

  const startCreate = () => {
    setCreating(true);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setCategory("");
  };

  const submitCreate = async () => {
    if (!title.trim()) return;
    setPending(true);
    await run(
      createProject({
        title: title.trim(),
        slug: slugify(slug || title),
        category: category || null,
        description: null,
        published: false,
      }),
      (data) => {
        const { id } = data as { id: string };
        router.push(`/admin/projects/${id}`);
      },
    );
    setCreating(false);
    setPending(false);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setPending(true);
    await run(deleteProject(toDelete.id));
    setPending(false);
    setToDelete(null);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-light uppercase tracking-[0.2em]">Projects</h1>
          <p className="mt-1 text-sm text-ash">
            {projects.length} project · hanya yang tayang dan punya foto utama bisa masuk hero.
          </p>
        </div>
        <button type="button" onClick={startCreate} className="admin-button admin-button-primary">
          Tambah project
        </button>
      </header>

      <FlashMessage flash={flash} />

      {creating ? (
        <div className="admin-card space-y-4 p-5">
          <p className="admin-heading">Project baru</p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="ui-label text-ash">Judul</span>
              <input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                }}
                className="admin-input"
                placeholder="Senja di Ubud"
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
                placeholder="senja-di-ubud"
              />
            </label>

            <label className="block space-y-1.5 md:col-span-2">
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
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="admin-button">
              Batal
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={pending || !title.trim()}
              className="admin-button admin-button-primary"
            >
              {pending ? "Menyimpan…" : "Buat dan unggah foto"}
            </button>
          </div>
        </div>
      ) : null}

      {projects.length === 0 ? (
        <p className="admin-card px-5 py-10 text-center text-sm text-ash">
          Belum ada project. Mulai dengan membuat satu project baru.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="admin-card flex flex-col">
              <div className="relative aspect-4/3 w-full overflow-hidden bg-ink">
                {project.cover ? (
                  <Image
                    src={project.cover.thumb_url ?? project.cover.url}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-ash">
                    Belum ada foto
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="truncate text-sm">{project.title}</p>
                  <p className="ui-label mt-1 truncate text-ash">/{project.slug}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-widest">
                  <span
                    className={
                      project.published
                        ? "border border-emerald-400/40 px-1.5 py-0.5 text-emerald-200"
                        : "border border-line px-1.5 py-0.5 text-ash"
                    }
                  >
                    {project.published ? "Tayang" : "Draft"}
                  </span>
                  <span className="border border-line px-1.5 py-0.5 text-ash">
                    {project.image_count} foto
                  </span>
                  {project.published && !project.cover ? (
                    <span className="border border-amber-400/40 px-1.5 py-0.5 text-amber-200">
                      Tanpa foto utama
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto flex gap-2">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="admin-button flex-1"
                  >
                    Ubah
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToDelete(project)}
                    className="admin-button admin-button-danger"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        busy={pending}
        title={`Hapus ${toDelete?.title ?? ""}?`}
        description={
          toDelete?.published
            ? "Project ini sedang tayang" +
              (toDelete.image_count > 0 ? ` dan punya ${toDelete.image_count} foto.` : ".") +
              " Semua fotonya ikut terhapus, termasuk yang tampil di lingkaran halaman utama."
            : "Semua foto project ini ikut terhapus. Tindakan ini tidak bisa dibatalkan."
        }
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
