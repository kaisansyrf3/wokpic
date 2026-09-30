import { notFound } from "next/navigation";

import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { requireAdminUser } from "@/lib/auth";
import { getServiceForEdit } from "@/lib/supabase/admin-queries";

export default async function ServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminUser(`/admin/services/${id}`);

  const service = await getServiceForEdit(id);
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
      publicPath={service.is_active ? "/service" : null}
    />
  );
}
