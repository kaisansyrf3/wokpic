import type { Metadata } from "next";

import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { listServiceCategoriesAdmin, listServicesAdmin } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdminPage() {
  const [services, categories] = await Promise.all([
    listServicesAdmin(),
    listServiceCategoriesAdmin(),
  ]);

  return <ServicesAdmin services={services} categories={categories} />;
}
