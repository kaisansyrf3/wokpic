import { AboutAdmin } from "@/components/admin/AboutAdmin";
import { getSiteSettings } from "@/lib/supabase/admin-queries";

export default async function AboutAdminPage() {
  const about = await getSiteSettings();
  return <AboutAdmin about={about} />;
}
