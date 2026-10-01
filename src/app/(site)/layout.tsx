import { SiteChrome } from "@/components/layout/SiteChrome";
import { getFooterLinks } from "@/lib/supabase/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const footerLinks = await getFooterLinks();

  return <SiteChrome footerLinks={footerLinks}>{children}</SiteChrome>;
}
