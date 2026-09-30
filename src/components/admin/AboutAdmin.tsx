"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { Sortable, SortableItem } from "@/components/admin/Sortable";
import { deleteAboutPhoto, saveAbout } from "@/app/admin/(panel)/about/actions";
import { socialPlatforms, type SocialPlatform } from "@/config/site";
import { prepareImage } from "@/lib/imageJob";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = /^image\/(jpeg|png|webp|avif)$/;

type SocialRow = { id: string; platform: SocialPlatform; url: string };

type About = {
  name: string | null;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
  socialLinks: { platform: string; url: string }[];
};

function toRows(links: About["socialLinks"]): SocialRow[] {
  return links.flatMap((link, index) =>
    socialPlatforms.includes(link.platform as SocialPlatform)
      ? [{
          id: `s${index}`,
          platform: link.platform as SocialPlatform,
          url: link.url,
        }]
      : [],
  );
}

export function AboutAdmin({ about }: { about: About }) {
  const router = useRouter();
  const { flash, setFlash, run } = useFlash();

  const [name, setName] = useState(about.name ?? "");
  const [role, setRole] = useState(about.role ?? "");
  const [bio, setBio] = useState(about.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(about.photoUrl);
  const [rows, setRows] = useState<SocialRow[]>(() => toRows(about.socialLinks));
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    if (!ACCEPTED.test(file.type)) {
      setPending(false);
      return { ok: false as const, message: "Hanya berkas JPEG, PNG, WebP, atau AVIF yang diterima." };
    }

    const supabase = createClient();
    const prepared = await prepareImage(file);
    const ext = prepared.large.type === "image/webp" ? "webp" : "jpg";
    const path = `about-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("site")
      .upload(path, prepared.large, { contentType: prepared.large.type, upsert: false });
    if (error) return { ok: false as const, message: `Gagal mengunggah: ${error.message}` };

    return {
      ok: true as const,
      url: supabase.storage.from("site").getPublicUrl(path).data.publicUrl,
    };
  };

  const onPick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadPhoto(file);
      if (result.ok) {
        setPhotoUrl(result.url);
      } else {
        setFlash({ kind: "error", text: result.message });
      }
    } catch (error) {
      setFlash({
        kind: "error",
        text: error instanceof Error ? error.message : "Foto gagal diunggah.",
      });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = async () => {
    if (!photoUrl) return;
    setPending(true);
    const ok = await run(deleteAboutPhoto(photoUrl));
    setPending(false);
    if (ok) {
      setPhotoUrl(null);
      router.refresh();
    }
  };

  const save = async () => {
    setPending(true);
    const ok = await run(
      saveAbout({
        about_name: name.trim() || null,
        about_role: role.trim() || null,
        about_bio: bio.trim() || null,
        about_photo_url: photoUrl,
        social_links: rows.map((row) => ({ platform: row.platform, url: row.url.trim() })),
      }),
    );
    setPending(false);
    if (ok) router.refresh();
  };

  const addRow = () => {
    const used = new Set(rows.map((row) => row.platform));
    const next = socialPlatforms.find((platform) => !used.has(platform)) ?? socialPlatforms[0];
    setRows([...rows, { id: `n${Date.now()}`, platform: next, url: "" }]);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-light uppercase tracking-[0.2em]">About</h1>
        <p className="mt-1 text-sm text-ash">
          Isi halaman About dan tautan sosial media di footer. Perubahan langsung tampil setelah
          disimpan.
        </p>
      </header>

      <FlashMessage flash={flash} />

      <section className="admin-card space-y-4 p-5">
        <p className="admin-heading">Profil</p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Nama</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="admin-input"
              placeholder="Nama pemilik studio"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="ui-label text-ash">Peran</span>
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="admin-input"
              placeholder="Fotografer pernikahan"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="ui-label text-ash">Bio singkat</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="admin-input"
            rows={6}
            placeholder="Dua sampai tiga kalimat tentang cara Anda bekerja."
          />
        </label>
      </section>

      <section className="admin-card space-y-4 p-5">
        <p className="admin-heading">Foto</p>

        <div className="flex flex-wrap items-start gap-5">
          <div className="relative aspect-3/4 w-36 shrink-0 overflow-hidden border border-line bg-ink">
            {photoUrl ? (
              <Image src={photoUrl} alt="Foto About" fill sizes="144px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] uppercase tracking-widest text-ash">
                Belum ada foto
              </span>
            )}
          </div>

          <div className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => onPick(event.target.files)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="admin-button admin-button-primary"
              >
                {uploading ? "Mengunggah…" : photoUrl ? "Ganti foto" : "Unggah foto"}
              </button>
              {photoUrl ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={pending}
                  className="admin-button admin-button-danger"
                >
                  Hapus foto
                </button>
              ) : null}
            </div>
            <p className="text-xs text-ash">
              Diperkecil di browser sampai sisi panjang 2000 px, disimpan di bucket <code>site</code>.
            </p>
          </div>
        </div>
      </section>

      <section className="admin-card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="admin-heading">Tautan sosial media ({rows.length})</p>
          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= socialPlatforms.length}
            className="admin-button"
          >
            Tambah tautan
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-ash">
            Belum ada tautan. Halaman About hanya menampilkan sosial media yang diisi di sini.
          </p>
        ) : (
          <Sortable
            ids={rows.map((row) => row.id)}
            onReorder={(ids) => {
              const current = new Map(rows.map((row) => [row.id, row]));
              setRows(ids.map((id) => current.get(id)).filter((row): row is SocialRow => Boolean(row)));
            }}
            className="space-y-2"
          >
            {rows.map((row) => (
              <SortableItem
                key={row.id}
                id={row.id}
                className="relative flex flex-wrap items-center gap-2 border border-line bg-ink p-2 pr-16"
              >
                <select
                  value={row.platform}
                  onChange={(event) =>
                    setRows(
                      rows.map((entry) =>
                        entry.id === row.id
                          ? { ...entry, platform: event.target.value as SocialPlatform }
                          : entry,
                      ),
                    )
                  }
                  className="admin-input w-40 border-0 bg-transparent uppercase"
                >
                  {socialPlatforms.map((platform) => (
                    <option key={platform} value={platform} className="bg-ink normal-case">
                      {platform}
                    </option>
                  ))}
                </select>

                <input
                  value={row.url}
                  onChange={(event) =>
                    setRows(
                      rows.map((entry) =>
                        entry.id === row.id ? { ...entry, url: event.target.value } : entry,
                      ),
                    )
                  }
                  className="admin-input min-w-0 flex-1 border-0 bg-transparent"
                  placeholder="https://instagram.com/nama"
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
          WhatsApp boleh memakai tautan <code>https://wa.me/628123456789</code>. URL wajib lengkap
          dengan <code>https://</code>.
        </p>
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending || uploading}
          className="admin-button admin-button-primary"
        >
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </div>
  );
}
