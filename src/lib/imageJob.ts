"use client";

import imageCompression from "browser-image-compression";

export type PreparedImage = {
  large: File;
  thumb: File;
  width: number;
  height: number;
  blurDataUrl: string | null;
};

const LARGE_EDGE = 2000;
const THUMB_EDGE = 600;

/** The ring and the viewer both frame photos as 4:3 landscape. */
export const PHOTO_RATIO = 4 / 3;

/** Photos are only warned about, never blocked, so a stray crop stays possible. */
export function isPhotoRatio(width: number, height: number): boolean {
  if (!width || !height) return true;
  return Math.abs(width / height - PHOTO_RATIO) / PHOTO_RATIO <= 0.05;
}

function supportsWebp(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

async function readDimensions(file: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Foto tidak bisa dibaca."));
      image.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A ~20px wide JPEG used as the LQIP placeholder, small enough for a text column. */
async function makeBlurDataUrl(file: Blob): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Foto tidak bisa dibaca."));
      image.src = url;
    });

    const scale = 20 / image.naturalWidth;
    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.filter = "blur(1px)";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.5);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Produces the two renditions the site needs: a large one for the viewer and a
 * small one for the ring, both encoded once on the client so the server never
 * has to touch image bytes.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const fileType = supportsWebp() ? "image/webp" : "image/jpeg";

  const [large, thumb] = await Promise.all([
    imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: LARGE_EDGE,
      fileType,
    }),
    imageCompression(file, {
      maxSizeMB: 0.25,
      maxWidthOrHeight: THUMB_EDGE,
      fileType,
    }),
  ]);

  const extension = fileType === "image/webp" ? "webp" : "jpg";
  const rename = (blob: Blob, suffix: string) =>
    new File([blob], `${suffix}.${extension}`, { type: fileType });

  const largeFile = rename(large, "large");
  const thumbFile = rename(thumb, "thumb");

  const { width, height } = await readDimensions(largeFile);
  const blurDataUrl = await makeBlurDataUrl(thumbFile);

  return { large: largeFile, thumb: thumbFile, width, height, blurDataUrl };
}
