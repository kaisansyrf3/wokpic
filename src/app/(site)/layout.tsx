import { SiteChrome } from "@/components/layout/SiteChrome";
import { getAboutContent } from "@/lib/supabase/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const about = await getAboutContent();

  return <SiteChrome socialLinks={about.socialLinks}>{children}</SiteChrome>;
}
