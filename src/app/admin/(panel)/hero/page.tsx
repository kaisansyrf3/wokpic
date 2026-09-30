import { HeroAdmin } from "@/components/admin/HeroAdmin";
import { getHeroSlotsAdmin, listHeroCandidates } from "@/lib/supabase/admin-queries";

export default async function HeroAdminPage() {
  const [candidates, slots] = await Promise.all([listHeroCandidates(), getHeroSlotsAdmin()]);

  return <HeroAdmin candidates={candidates} initialSlots={slots} />;
}
