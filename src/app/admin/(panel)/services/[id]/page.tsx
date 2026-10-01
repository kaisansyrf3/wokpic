import { notFound } from "next/navigation";

import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { requireAdminUser } from "@/lib/auth";
import {
  getServiceForEdit,
  listServiceCategoriesAdmin,
} from "@/lib/supabase/admin-queries";

export default async function ServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminUser(`/admin/services/${id}`);

  const [service, categories] = await Promise.all([
    getServiceForEdit(id),
    listServiceCategoriesAdmin(),
  ]);
  if (!service) notFound();

  return (
    <ServiceEditor
      service={{
        id: service.id,
        slug: service.slug,
        name: service.name,
        tagline: service.tagline,
        price: service.price,
        features: service.features,
        is_active: service.is_active,
      }}
      categories={categories}
      initialCategorySlugs={service.placements.map((placement) => placement.slug)}
      publicPath={service.is_active ? "/service" : null}
    />
  );
}
