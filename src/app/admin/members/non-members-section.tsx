import { AdminSection } from "@/components/admin/admin-page";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { NonMembersTable } from "./non-members-table";

/** People who appear in results without a BOM ID. They are not on the leaderboard; link one to a member if they turn out to be one. */
export async function NonMembersSection() {
  const supabase = await requireAdmin();
  const [guests, players] = await Promise.all([supabaseResults(supabase).guests(), supabasePlayers(supabase).list(1000, { includeRegistered: true })]);
  return (
    <AdminSection id="non-members" title="Non BOM ID" hint="Names that took part in results without a BOM ID. They count as participants but are not on the leaderboard or shown in results. If one is really a member, link them: all their results move to that member and points are recalculated.">
      <NonMembersTable
        guests={guests}
        members={players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : []))}
      />
    </AdminSection>
  );
}
