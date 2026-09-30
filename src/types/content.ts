import type { Database, SocialLink } from "@/types/database";

type Service = Database["public"]["Tables"]["services"]["Row"];

export type RingImage = {
  url: string;
  thumbUrl: string;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
};

export type HeroItem = RingImage & {
  position: number;
  projectId: string;
  slug: string;
  title: string;
  category: string | null;
};

export type ProjectPhoto = RingImage & {
  id: string;
};

export type ProjectDetail = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  photos: ProjectPhoto[];
};

export type ServiceWithFeatures = Omit<Service, "features"> & {
  features: string[];
};

export type AboutContent = {
  name: string | null;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
  socialLinks: SocialLink[];
};
