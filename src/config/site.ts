const brand = "WOKAI PICTURE";

export const siteConfig = {
  name: brand,
  tagline: "Wedding Photography",
  description:
    "Portofolio fotografi pernikahan. Cerita yang direkam dengan cahaya, ketenangan, dan detail.",
  // Trailing slash removed: paths are concatenated with this value as a prefix.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  locale: "id_ID",
  timezone: "Asia/Jakarta",
  // Put the real mark at public/logo.png (transparent) and match these two intrinsic pixel sizes.
  logo: { src: "/logo.png", alt: brand, width: 196, height: 90 },
} as const;

export const navLinks = [
  { label: "WORKS", href: "/" },
  { label: "SERVICE", href: "/service" },
  { label: "CONTACT", href: "/contact" },
  { label: "ABOUT", href: "/about" },
] as const;

export const socialPlatforms = [
  "instagram",
  "whatsapp",
  "tiktok",
  "youtube",
  "facebook",
] as const;

export type SocialPlatform = (typeof socialPlatforms)[number];

export const projectCategories = ["prewedding", "wedding", "engagement"] as const;

export type ProjectCategory = (typeof projectCategories)[number];
