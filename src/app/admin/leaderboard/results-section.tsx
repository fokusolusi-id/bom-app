import { AdminSection, ItemGrid } from "@/components/admin/admin-page";
import Image from "next/image";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventUsesBomLogo } from "@/domain/event";
import { eventPoints } from "@/domain/standings";
import { isTier } from "@/domain/tier";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { canManageResults } from "@/domain/access";
import { requireStaff } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSettings } from "@/server/settings";
import { PlacementRow } from "./placement-row";
import { ResultsEntry } from "./results-entry";

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;
const RECENT = 20;

/** Who took part in each past event that awards points (Ranked, Cup, Major, Championship), with their places. The events themselves are added under Schedule. */
export async function ResultsSection() {
  const staff = await requireStaff();
  const supabase = staff.supabase;
  const now = new Date();
  const [all, players, table] = await Promise.all([
    supabaseScheduleEvents(supabase).between(new Date(now.getTime() - 365 * DAY).toISOString(), now.toISOString(), { includeInactive: true }),
    supabasePlayers(supabase).list(1000, { includeRegistered: true }),
    supabaseSettings(supabase).pointsTable(),
  ]);
  const events = all.filter((e) => isTier(e.tier) && canManageResults(staff, e)).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, RECENT);
  const placements = await supabaseResults(supabase).placementsForEvents(events.flatMap((e) => (e.id ? [e.id] : [])));
  const byId = new Map(players.map((p) => [p.id, p]));
  return (
    <AdminSection id="results" title="Results" hint="Who took part in each past Ranked, Cup, Major or Championship event. Points are calculated from this, the number of participants and the points table, and added to the leaderboard. The 20 most recent events are listed; add events under Schedule.">
      {events.length === 0 && <p className="text-muted-foreground text-sm">No past events that award points yet.</p>}
      <ItemGrid>
        {events.map((e) => (
          <Card key={e.id}>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                {/* Cup and above belong to BOM as a whole, so they show the BOM logo, as on the calendar. */}
                {(() => {
                  const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
                  return <Image src={bom ? BOM_LOGO : mediaUrl(e.community!.image_path!)} alt={bom ? "BOM" : e.community!.name} width={96} height={96} className="size-16 shrink-0 object-contain" />;
                })()}
                <TierTile tier={e.tier} className="size-16" />
              </div>
              <div>
                <div className={`font-label text-lg font-bold tracking-[0.08em] uppercase italic ${TIER_TILE[e.tier].title}`}>{EVENT_TYPE_LABEL(e.tier)}</div>
                <CardTitle className="font-display text-2xl leading-tight font-extrabold italic uppercase">{e.name}</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">{when.format(new Date(e.starts_at))}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const nameOf = (r: { player_id: string | null; guest_name: string | null }) => (r.player_id ? byId.get(r.player_id)?.name : r.guest_name) ?? "";
                const rows = placements.filter((p) => p.event_id === e.id).sort((a, b) => (a.place ?? 999) - (b.place ?? 999) || nameOf(a).localeCompare(nameOf(b)));
                const text = rows.map((r) => `${r.place === null ? "" : `${r.place}. `}${nameOf(r)}${r.tiger_king ? " (TK)" : ""}`).join("\n");
                return (
                  <>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">{rows.length} participants</p>
                      <ul className="space-y-2 text-sm">
                        {rows.map((pl) => (
                          <PlacementRow key={pl.id} eventId={e.id!} rowId={pl.id} playerId={pl.player_id} name={nameOf(pl)} bomId={pl.player_id ? byId.get(pl.player_id)?.bom_id ?? "" : null} place={pl.place} tigerKing={pl.tiger_king}
                            points={eventPoints(table, e.tier, { place: pl.place, tigerKing: pl.tiger_king }, rows.length)} />
                        ))}
                      </ul>
                    </div>
                    <ResultsEntry eventId={e.id!} text={text} challongeUrl={e.challonge_url ?? null} hasChallongeKey={!!process.env.CHALLONGE_API_KEY}
                      members={players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : []))} />
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminSection>
  );
}
