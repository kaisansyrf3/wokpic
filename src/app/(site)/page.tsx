import { RingCaption } from "@/components/home/RingCaption";
import { RingGallery } from "@/components/home/RingGallery";
import { getHeroItems } from "@/lib/supabase/queries";

export default async function LandingPage() {
  const items = await getHeroItems();

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="ui-label max-w-sm text-ash">
          Portofolio sedang disiapkan. Silakan kembali beberapa saat lagi.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <RingGallery items={items} />
      <RingCaption items={items} />
    </div>
  );
}
