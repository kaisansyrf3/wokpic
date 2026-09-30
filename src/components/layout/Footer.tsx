import { siteConfig } from "@/config/site";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-line px-5 py-6 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="ui-label text-ash">
          &copy; {year} {siteConfig.name}. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
