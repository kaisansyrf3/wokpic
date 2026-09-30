export const siteConfig = {
  name: "IKAI",
  wordmark: "IKAI",
  tagline: "Wedding Photography",
  description:
    "Portofolio fotografi pernikahan. Cerita yang direkam dengan cahaya, ketenangan, dan detail.",
  // Trailing slash removed: paths are concatenated with this value as a prefix.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  locale: "id_ID",
  timezone: "Asia/Jakarta",
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
