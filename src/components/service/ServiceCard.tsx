import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { pad2 } from "@/lib/utils";

export type ServiceCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  features: string[];
};

export function ServiceCard({ service, index }: { service: ServiceCardData; index: number }) {
  return (
    <article
      data-reveal
      className="flex flex-col border border-line bg-ink-soft/40 p-6 md:p-7"
      aria-label={service.name}
    >
      <p className="ui-label text-ash">{pad2(index + 1)}</p>

      <h2 className="mt-3 text-lg font-light uppercase tracking-[0.14em]">{service.name}</h2>

      {service.tagline ? <p className="mt-2 text-sm text-ash">{service.tagline}</p> : null}

      <p className="mt-5 text-xl font-light">{formatRupiah(service.price)}</p>

      {service.features.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          {service.features.map((feature, featureIndex) => (
            <li key={`${service.id}-${featureIndex}`} className="flex gap-3 text-ash">
              <span aria-hidden className="text-chalk/30">
                —
              </span>
              <span className="min-w-0 flex-1">{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href={`/contact?service=${encodeURIComponent(service.slug)}`}
        className="ui-label mt-6 inline-flex items-center justify-between border border-line px-4 py-3 text-center uppercase tracking-widest transition-colors hover:border-chalk hover:text-chalk"
      >
        Pilih paket
        <span aria-hidden>&rarr;</span>
      </Link>
    </article>
  );
}
