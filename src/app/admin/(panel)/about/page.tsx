import type { Metadata } from "next";

import { AboutAdmin } from "@/components/admin/AboutAdmin";
import { getSiteSettings } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = { title: "About" };

export default async function AboutAdminPage() {
  const about = await getSiteSettings();
  return <AboutAdmin about={about} />;
}
