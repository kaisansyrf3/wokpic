import { z } from "zod";

import { socialPlatforms } from "@/config/site";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug wajib diisi.")
  .max(80, "Slug maksimal 80 karakter.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.");

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(120, "Judul maksimal 120 karakter."),
  slug: slugSchema,
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

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Nama paket wajib diisi.").max(80, "Nama maksimal 80 karakter."),
  slug: slugSchema,
  tagline: z.string().trim().max(200, "Tagline maksimal 200 karakter.").nullable().optional(),
  price: z.coerce
    .number("Harga harus berupa angka.")
    .int("Harga harus bilangan bulat rupiah.")
    .min(0, "Harga tidak boleh negatif.")
    .max(1_000_000_000_000, "Harga terlalu besar."),
  features: z
    .array(z.string().trim().min(1, "Rincian tidak boleh kosong.").max(300, "Rincian terlalu panjang."))
    .max(40, "Maksimal 40 rincian jasa."),
  is_active: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const serviceOrderSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, "Tidak ada paket untuk diurutkan."),
});

const socialPlatformSchema = z.enum(socialPlatforms, {
  error: "Platform media sosial tidak dikenal.",
});

export const aboutSchema = z.object({
  about_name: z.string().trim().max(80, "Nama maksimal 80 karakter.").nullable().optional(),
  about_role: z.string().trim().max(80, "Peran maksimal 80 karakter.").nullable().optional(),
  about_bio: z.string().trim().max(4000, "Bio maksimal 4000 karakter.").nullable().optional(),
  about_photo_url: z
    .string()
    .trim()
    .url("Alamat foto tidak valid.")
    .nullable()
    .optional(),
  social_links: z
    .array(
      z.object({
        platform: socialPlatformSchema,
        url: z.string().trim().url("Alamat tautan tidak valid."),
      }),
    )
    .max(10, "Maksimal 10 tautan sosial media."),
});

export type AboutInput = z.infer<typeof aboutSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(80, "Nama maksimal 80 karakter."),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .max(160, "Email terlalu panjang.")
    .email("Format email tidak valid."),
  phone: z.string().trim().max(30, "Nomor telepon terlalu panjang."),
  service_slug: z.string().trim().max(80),
  body: z
    .string()
    .trim()
    .min(10, "Ceritakan sedikit lebih panjang, minimal 10 karakter.")
    .max(2000, "Pesan maksimal 2000 karakter."),
});

export type ContactInput = z.infer<typeof contactSchema>;
