import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { listServicesAdmin } from "@/lib/supabase/admin-queries";

export default async function ServicesAdminPage() {
  const services = await listServicesAdmin();
  return <ServicesAdmin services={services} />;
}
