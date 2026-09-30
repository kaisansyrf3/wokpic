import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(120, "Judul maksimal 120 karakter."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(80, "Slug maksimal 80 karakter.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  category: z.string().trim().max(40).nullable().optional(),
  description: z.string().trim().max(4000, "Deskripsi terlalu panjang.").nullable().optional(),
  published: z.boolean(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/** One photo produced on the client and handed to the server for recording. */
export const imagePayloadSchema = z.object({
  url: z.string().url("Alamat foto tidak valid."),
  thumbUrl: z.string().url("Alamat foto tidak valid."),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataUrl: z
    .string()
    .max(20000, "Data blur terlalu besar.")
    .regex(/^data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]*$/, "Data blur tidak valid.")
    .nullable()
    .optional(),
});

export const imagePayloadListSchema = z.object({
  projectId: z.string().uuid(),
  images: z.array(imagePayloadSchema).min(1, "Tidak ada foto untuk disimpan.").max(30),
});

export const imageOrderSchema = z.object({
  projectId: z.string().uuid(),
  imageIds: z.array(z.string().uuid()).min(1),
});

export const heroSchema = z.object({
  projectIds: z.array(z.string().uuid()).length(8, "Hero harus berisi tepat 8 project."),
});
