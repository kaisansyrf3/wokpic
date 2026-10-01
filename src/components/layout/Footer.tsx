import { siteConfig } from "@/config/site";
import { withWhatsAppLink } from "@/lib/social";
import type { FooterLinks } from "@/types/content";

const year = new Date().getFullYear();

export function Footer({ footerLinks }: { footerLinks: FooterLinks }) {
  const links = withWhatsAppLink(footerLinks.socialLinks, footerLinks.whatsappNumber);

  return (
    <footer className="border-t border-line px-5 py-6 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="ui-label text-ash">
          &copy; {year} {siteConfig.name}. Seluruh hak cipta dilindungi.
        </p>

        {links.length > 0 ? (
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Media sosial">
            {links.map((link) => (
              <a
                key={`${link.platform}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-label text-chalk/70 transition-colors hover:text-chalk"
              >
                {link.platform}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
