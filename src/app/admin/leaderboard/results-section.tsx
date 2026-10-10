import { AdminSection } from "@/components/admin/admin-page";
import { canManageResults } from "@/domain/access";
import { eventUsesBomLogo } from "@/domain/event";
import { eventPoints } from "@/domain/standings";
import { isTier, type Tier } from "@/domain/tier";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { requireStaff } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSettings } from "@/server/settings";
import { ResultsBrowser, type ResultEvent } from "./results-browser";

/** Every past event that awards points (Ranked, Cup, Major, Championship), with who took part. The events themselves are added under Schedule. */
export async function ResultsSection() {
  const staff = await requireStaff();
  const supabase = staff.supabase;
  const now = new Date();
  const [all, players, table] = await Promise.all([
    supabaseScheduleEvents(supabase).between("2020-01-01T00:00:00Z", now.toISOString(), { includeInactive: true }),
    supabasePlayers(supabase).list(1000, { includeRegistered: true }),
    supabaseSettings(supabase).pointsTable(),
  ]);
  const events = all.filter((e) => isTier(e.tier) && canManageResults(staff, e)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const placements = await supabaseResults(supabase).placementsForEvents(events.flatMap((e) => (e.id ? [e.id] : [])));
  const byId = new Map(players.map((p) => [p.id, p]));
  const nameOf = (r: { player_id: string | null; guest_name: string | null }) => (r.player_id ? byId.get(r.player_id)?.name : r.guest_name) ?? "";

  const data: ResultEvent[] = events.flatMap((e) => {
    if (!e.id) return [];
    const rows = placements.filter((p) => p.event_id === e.id).sort((a, b) => (a.place ?? 999) - (b.place ?? 999) || nameOf(a).localeCompare(nameOf(b)));
    // Cup and above belong to BOM as a whole, so they show the BOM logo, as on the calendar.
    const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
    return [{
      id: e.id, name: e.name, tier: e.tier as Tier, startsAt: e.starts_at, challongeUrl: e.challonge_url ?? null,
      communityId: e.sub_community_id, communityName: e.community?.name ?? "BOM",
      logo: { src: bom ? BOM_LOGO : mediaUrl(e.community!.image_path!), alt: bom ? "BOM" : e.community!.name },
      text: rows.map((r) => `${r.place === null ? "" : `${r.place}. `}${nameOf(r)}${r.tiger_king ? " (TK)" : ""}`).join("\n"),
      rows: rows.map((r) => ({
        id: r.id, playerId: r.player_id, name: nameOf(r), bomId: r.player_id ? byId.get(r.player_id)?.bom_id ?? "" : null,
        place: r.place, tigerKing: r.tiger_king, points: eventPoints(table, e.tier, { place: r.place, tigerKing: r.tiger_king }, rows.length),
      })),
    }];
  });

  return (
    <AdminSection id="results" title="Results" hint="Every past Ranked, Cup, Major or Championship event. Filter by competition type and sub community, then open an event to enter or correct who took part. Points are calculated from this, the number of participants and the points table. Add events under Schedule.">
      <ResultsBrowser
        events={data}
        members={players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : []))}
        hasChallongeKey={!!process.env.CHALLONGE_API_KEY}
      />
    </AdminSection>
  );
}
