"use client";

import { useRef, useState } from "react";

import { recordImages } from "@/app/admin/(panel)/projects/actions";
import { FlashMessage, useFlash } from "@/components/admin/Flash";
import { prepareImage, isPhotoRatio } from "@/lib/imageJob";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = /^image\/(jpeg|png|webp|avif)$/;

export function PhotoUploader({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { flash, setFlash } = useFlash();

  const upload = async (files: File[]) => {
    const usable = files.filter((file) => ACCEPTED.test(file.type));
    if (usable.length === 0) {
      setFlash({ kind: "error", text: "Hanya berkas JPEG, PNG, WebP, atau AVIF yang diterima." });
      return;
    }

    const supabase = createClient();
    const payloads: Array<Record<string, unknown>> = [];
    const offRatio: string[] = [];
    const failures: string[] = [];

    setProgress({ done: 0, total: usable.length });

    for (const [index, file] of usable.entries()) {
      try {
        const prepared = await prepareImage(file);

        if (!isPhotoRatio(prepared.width, prepared.height)) offRatio.push(file.name);

        const uploadOne = async (blob: Blob, suffix: string) => {
          const path = `${projectId}/${crypto.randomUUID()}-${suffix}.${blob.type === "image/webp" ? "webp" : "jpg"}`;
          const { error } = await supabase.storage
            .from("portfolio")
            .upload(path, blob, { contentType: blob.type, upsert: false });

          if (error) throw new Error(error.message);
          return supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
        };

        const [url, thumbUrl] = await Promise.all([
          uploadOne(prepared.large, "large"),
          uploadOne(prepared.thumb, "thumb"),
        ]);

        payloads.push({
          url,
          thumbUrl,
          width: prepared.width,
          height: prepared.height,
          blurDataUrl: prepared.blurDataUrl,
        });
      } catch (error) {
        failures.push(
          `${file.name}: ${error instanceof Error ? error.message : "gagal diunggah"}`,
        );
      }

      setProgress({ done: index + 1, total: usable.length });
    }

    if (payloads.length) {
      const result = await recordImages(projectId, payloads);
      if (!result.ok) setFlash({ kind: "error", text: result.message });
      else onUploaded();
    }

    if (failures.length) {
      setFlash({
        kind: "error",
        text: `${payloads.length} foto berhasil, ${failures.length} gagal (${failures[0]}).`,
      });
    } else if (offRatio.length > 0) {
      setFlash({
        kind: "warn",
        text: `${offRatio.length} dari ${payloads.length} foto bukan rasio 4:3 dan mungkin terpotong di ring (mis. ${offRatio[0]}).`,
      });
    } else if (payloads.length) {
      setFlash({ kind: "ok", text: `${payloads.length} foto diunggah.` });
    }

    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(event) => upload(Array.from(event.target.files ?? []))}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="admin-button admin-button-primary"
        >
          Unggah foto
        </button>
        <p className="text-xs text-ash">
          Bisa banyak sekaligus. Sisi browser yang mengecilkan jadi 2000 px dan 600 px. Foto
          sebaiknya 4:3 landscape.
        </p>
      </div>

      {progress ? (
        <p className="text-xs text-ash">
          Mengunggah {progress.done} dari {progress.total}…
        </p>
      ) : null}

      <FlashMessage flash={flash} />
    </div>
  );
}
