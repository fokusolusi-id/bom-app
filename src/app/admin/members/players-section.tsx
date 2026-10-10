import { AdminSection } from "@/components/admin/admin-page";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { toRows } from "./player-rows";
import { PlayersTable } from "./players-table";

/** Every player with what they entered on the membership form, in a searchable table. */
export async function PlayersSection() {
  const rows = toRows(await supabasePlayers(await requireAdmin()).listForAdmin());
  return (
    <AdminSection id="members" title="Members" hint="Every member. Edit shows the member and everything they entered on the membership form. Roles are Member, Organizer and Admin. Points are calculated from results. Changing a BOM ID changes the member's page address.">
      <PlayersTable players={rows} />
    </AdminSection>
  );
}
