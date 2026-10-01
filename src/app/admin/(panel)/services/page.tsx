import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { listServiceCategoriesAdmin, listServicesAdmin } from "@/lib/supabase/admin-queries";

export default async function ServicesAdminPage() {
  const [services, categories] = await Promise.all([
    listServicesAdmin(),
    listServiceCategoriesAdmin(),
  ]);

  return <ServicesAdmin services={services} categories={categories} />;
}
