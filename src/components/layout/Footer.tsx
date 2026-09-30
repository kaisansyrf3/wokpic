import { siteConfig } from "@/config/site";
import type { SocialLink } from "@/types/database";

const year = new Date().getFullYear();

export function Footer({ socialLinks }: { socialLinks: SocialLink[] }) {
  return (
    <footer className="border-t border-line px-5 py-6 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="ui-label text-ash">
          &copy; {year} {siteConfig.name}. Seluruh hak cipta dilindungi.
        </p>

        <nav className="flex flex-wrap items-center gap-6" aria-label="Media sosial">
          {socialLinks.map((link) => (
            <a
              key={`${link.platform}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-label text-ash transition-colors hover:text-chalk"
            >
              {link.platform}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
