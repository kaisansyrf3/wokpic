import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type {
  AdminServiceRow,
  ServiceCatalog,
  ServicePlacement,
  ServiceWithFeatures,
} from "@/types/content";
import { parseFeatures } from "@/lib/contentParsers";

type AnyClient = SupabaseClient<Database>;

type Service = Database["public"]["Tables"]["services"]["Row"];
type Category = Database["public"]["Tables"]["service_categories"]["Row"];
type Link = Database["public"]["Tables"]["service_category_links"]["Row"];

/** The three tables the package catalogue is made of, loaded in one pass. */
export type ServiceGraph = {
  categories: Category[];
  services: Service[];
  links: Link[];
};

export async function readServiceGraph(
  client: AnyClient,
  activeOnly: boolean,
): Promise<ServiceGraph> {
  const servicesQuery = client
    .from("services")
    .select("*")
    .order("created_at", { ascending: true });
  const categoriesQuery = client
    .from("service_categories")
    .select("id, slug, name, sort_order")
    .order("sort_order", { ascending: true });
  const linksQuery = client
    .from("service_category_links")
    .select("service_id, category_id, sort_order")
    .order("sort_order", { ascending: true });

  const [categories, services, links] = await Promise.all([
    categoriesQuery,
    activeOnly ? servicesQuery.eq("is_active", true) : servicesQuery,
    linksQuery,
  ]);

  if (categories.error) throw new Error(`Gagal memuat kategori: ${categories.error.message}`);
  if (services.error) throw new Error(`Gagal memuat paket: ${services.error.message}`);
  if (links.error) throw new Error(`Gagal memuat urutan paket: ${links.error.message}`);

  return {
    categories: categories.data ?? [],
    services: services.data ?? [],
    links: links.data ?? [],
  };
}

function toServiceRow(service: Service): ServiceWithFeatures {
  return { ...service, features: parseFeatures(service.features) };
}

function createdOf(service: Service | undefined): string {
  return service?.created_at ?? "";
}

/** Package ids per category slug, in that category's own saved order. */
function placementIdsByCategory(graph: ServiceGraph): Record<string, string[]> {
  const serviceById = new Map<string, Service>(graph.services.map((s) => [s.id, s]));
  const slugByCategory = new Map(graph.categories.map((c) => [c.id, c.slug]));
  const grouped = new Map<string, Link[]>();

  for (const link of graph.links) {
    const slug = slugByCategory.get(link.category_id);
    // A link to an unknown package is invisible: RLS hides links of inactive
    // packages from anon reads, so those rows simply drop out here.
    if (!slug || !serviceById.has(link.service_id)) continue;
    grouped.set(slug, [...(grouped.get(slug) ?? []), link]);
  }

  const result: Record<string, string[]> = {};

  for (const category of graph.categories) {
    const rows = (grouped.get(category.slug) ?? []).sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        createdOf(serviceById.get(a.service_id)).localeCompare(
          createdOf(serviceById.get(b.service_id)),
        ),
    );
    result[category.slug] = rows.map((link) => link.service_id);
  }

  return result;
}

/** Public `/service`: the tabs plus the packages and order for each of them. */
export function buildServiceCatalog(graph: ServiceGraph): ServiceCatalog {
  const idsByCategory = placementIdsByCategory(graph);

  return {
    categories: graph.categories.map((category) => ({
      slug: category.slug,
      name: category.name,
    })),
    // Every active package is returned once; the tabs pick by id.
    services: graph.services.map(toServiceRow),
    serviceIdsByCategory: idsByCategory,
  };
}

/**
 * Public `/contact` dropdown: one entry per package, ordered by category and then
 * by the package's position inside that category, ignoring later repeats.
 */
export function buildFlatServices(graph: ServiceGraph): ServiceWithFeatures[] {
  const serviceById = new Map<string, Service>(graph.services.map((s) => [s.id, s]));
  const ordered: Service[] = [];
  const seen = new Set<string>();

  for (const ids of Object.values(placementIdsByCategory(graph))) {
    for (const id of ids) {
      if (seen.has(id)) continue;
      const service = serviceById.get(id);
      if (!service) continue;
      seen.add(id);
      ordered.push(service);
    }
  }

  // A package with no category can't sit on a tab, but it stays reachable here
  // so the owner never loses a package from the site.
  for (const service of graph.services) {
    if (seen.has(service.id)) continue;
    seen.add(service.id);
    ordered.push(service);
  }

  return ordered.map(toServiceRow);
}

/** Admin rows: each package with its categories, sorted by its primary placement. */
export function buildAdminServices(graph: ServiceGraph): AdminServiceRow[] {
  const categoryById = new Map(graph.categories.map((c) => [c.id, c]));
  const orderOfCategory = new Map(graph.categories.map((c, index) => [c.slug, index]));

  const placements = new Map<string, ServicePlacement[]>();
  for (const link of graph.links) {
    const category = categoryById.get(link.category_id);
    if (!category) continue;
    const list = placements.get(link.service_id) ?? [];
    list.push({ slug: category.slug, name: category.name, sortOrder: link.sort_order });
    placements.set(link.service_id, list);
  }

  const rank = (list: ServicePlacement[]) => {
    if (list.length === 0) return Number.MAX_SAFE_INTEGER;
    return Math.min(
      ...list.map(
        (placement) =>
          (orderOfCategory.get(placement.slug) ?? Number.MAX_SAFE_INTEGER) * 1000 +
          placement.sortOrder,
      ),
    );
  };

  return graph.services
    .map((service) => ({
      ...toServiceRow(service),
      placements: [...(placements.get(service.id) ?? [])].sort(
        (a, b) =>
          (orderOfCategory.get(a.slug) ?? 0) - (orderOfCategory.get(b.slug) ?? 0) ||
          a.sortOrder - b.sortOrder,
      ),
    }))
    .sort((a, b) => rank(a.placements) - rank(b.placements));
}
