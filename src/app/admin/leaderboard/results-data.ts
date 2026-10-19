import { canManageResults, type Access } from "@/domain/access";
import { eventUsesBomLogo } from "@/domain/event";
import { formatBomId } from "@/domain/profile";
import { eventPoints } from "@/domain/standings";
import type { TierLabel } from "@/domain/tier";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import type { requireStaff } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSettings } from "@/server/settings";
import type { ResultEvent } from "./results-browser";

type Staff = Awaited<ReturnType<typeof requireStaff>> & Access;

/**
 * The past events of the Results list (every event except a break, Unrank included: it earns no points, but who took part can
 * be kept), each with its participants, points and the list text; or just one event by id. Only the events this person may
 * enter results for.
 */
export async function loadResultEvents(staff: Staff, eventId?: string): Promise<{ events: ResultEvent[]; members: { id: string; name: string; bom_id: string }[] }> {
  const supabase = staff.supabase;
  const [all, players, table] = await Promise.all([
    supabaseScheduleEvents(supabase).between("2020-01-01T00:00:00Z", new Date().toISOString(), { includeInactive: true }),
    supabasePlayers(supabase).list(1000, { includeRegistered: true }),
    supabaseSettings(supabase).pointsTable(),
  ]);
  const events = all.filter((e) => e.tier !== "Break" && canManageResults(staff, e) && (!eventId || e.id === eventId)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const placements = await supabaseResults(supabase).placementsForEvents(events.flatMap((e) => (e.id ? [e.id] : [])));
  const byId = new Map(players.map((p) => [p.id, p]));
  const nameOf = (r: { player_id: string | null; guest_name: string | null }) => (r.player_id ? byId.get(r.player_id)?.name : r.guest_name) ?? "";

  const data: ResultEvent[] = events.flatMap((e) => {
    if (!e.id) return [];
    const rows = placements.filter((p) => p.event_id === e.id).sort((a, b) => (a.place ?? 999) - (b.place ?? 999) || nameOf(a).localeCompare(nameOf(b)));
    // Major and above belong to BOM as a whole, so they show the BOM logo, as on the calendar.
    const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
    return [{
      id: e.id, name: e.name, tier: e.tier as TierLabel, startsAt: e.starts_at, challongeUrl: e.challonge_url ?? null,
      communityId: e.sub_community_id, communityName: e.community?.name ?? "BOM",
      logo: { src: bom ? BOM_LOGO : mediaUrl(e.community!.image_path!), alt: bom ? "BOM" : e.community!.name },
      // The same shape the list is typed in: "1 [BOM-001] Name (TK)", then the combos, with a blank line between members.
      text: rows.map((r) => [`${r.place === null ? "" : `${r.place} `}${r.player_id ? formatBomId(byId.get(r.player_id)?.bom_id ?? "") : "[Non BOM ID]"} ${nameOf(r)}${r.tiger_king ? " (TK)" : ""}`, ...r.combos].join("\n")).join("\n\n"),
      rows: rows.map((r) => ({
        id: r.id, playerId: r.player_id, name: nameOf(r), bomId: r.player_id ? byId.get(r.player_id)?.bom_id ?? "" : null,
        place: r.place, tigerKing: r.tiger_king, combos: r.combos, points: eventPoints(table, e.tier, { place: r.place, tigerKing: r.tiger_king }, rows.length),
      })),
    }];
  });
  return { events: data, members: players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : [])) };
}
