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

export type ServiceCategoryOption = {
  slug: string;
  name: string;
};

/** Which categories a package sits in, and its position inside each of them. */
export type ServicePlacement = ServiceCategoryOption & {
  sortOrder: number;
};

/** Everything `/service` needs, fetched once and handed to the client tabs. */
export type ServiceCatalog = {
  categories: ServiceCategoryOption[];
  services: ServiceWithFeatures[];
  serviceIdsByCategory: Record<string, string[]>;
};

/** Admin list row: the package plus every category it belongs to. */
export type AdminServiceRow = ServiceWithFeatures & {
  placements: ServicePlacement[];
};

export type AboutContent = {
  name: string | null;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
  socialLinks: SocialLink[];
};
