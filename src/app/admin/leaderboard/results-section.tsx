import { AdminSection, ItemGrid } from "@/components/admin/admin-page";
import { Crown } from "lucide-react";
import Image from "next/image";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTip } from "@/components/ui/help-tip";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { eventUsesBomLogo } from "@/domain/event";
import { eventPoints } from "@/domain/standings";
import { isTier } from "@/domain/tier";
import { formatBomId } from "@/domain/profile";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSettings } from "@/server/settings";
import { saveEventResults, setPlacement } from "./actions";
import { PlacementRow } from "./placement-row";

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;
const RECENT = 20;
const TEMPLATE = "Mr. DiBo\nPrett (TK)\nBoM-010\nHirono\nZenn X";

/** Who took part in each past event that awards points (Ranked, Cup, Major, Championship), with their places. The events themselves are added under Schedule. */
export async function ResultsSection() {
  const supabase = await requireAdmin();
  const now = new Date();
  const [all, players, table] = await Promise.all([
    supabaseScheduleEvents(supabase).between(new Date(now.getTime() - 365 * DAY).toISOString(), now.toISOString(), { includeInactive: true }),
    supabasePlayers(supabase).list(1000, { includeRegistered: true }),
    supabaseSettings(supabase).pointsTable(),
  ]);
  const events = all.filter((e) => isTier(e.tier)).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, RECENT);
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
                const rows = placements.filter((p) => p.event_id === e.id).sort((a, b) => (a.place ?? 999) - (b.place ?? 999) || (byId.get(a.player_id)?.name ?? "").localeCompare(byId.get(b.player_id)?.name ?? ""));
                const text = rows.map((r) => `${byId.get(r.player_id)?.name ?? ""}${r.tiger_king ? " (TK)" : ""}`).join("\n");
                return (
                  <>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">{rows.length} participants</p>
                      <ul className="space-y-2 text-sm">
                        {rows.map((pl) => (
                          <PlacementRow key={pl.player_id} eventId={e.id!} playerId={pl.player_id} name={byId.get(pl.player_id)?.name ?? pl.player_id} bomId={byId.get(pl.player_id)?.bom_id ?? ""} place={pl.place} tigerKing={pl.tiger_king}
                            points={eventPoints(table, e.tier, { place: pl.place, tigerKing: pl.tiger_king }, rows.length)} />
                        ))}
                      </ul>
                    </div>
                    <ActionForm action={saveEventResults.bind(null, e.id!)} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-bold" htmlFor={`results-${e.id}`}>Enter all results at once</label>
                        <HelpTip label="How to enter results">
                          <p>One player per line, by blader name or BOM ID (BoM-003, bom 3 or just 3).</p>
                          <p>The first line is 1st place, the second 2nd, up to 8th. Every line after that took part without a place.</p>
                          <p>Add (TK) after the Tiger King, once. Saving replaces the results of this event.</p>
                          <pre className="bg-muted/60 rounded p-2 whitespace-pre">{TEMPLATE}</pre>
                        </HelpTip>
                      </div>
                      <Textarea id={`results-${e.id}`} name="results" defaultValue={text} rows={Math.min(12, Math.max(6, rows.length + 1))} placeholder={TEMPLATE} className="font-mono text-base text-white" />
                      <Button type="submit">Save results</Button>
                    </ActionForm>
                    <ActionForm action={setPlacement} resetOnSuccess className="grid gap-3 border-t pt-4 sm:grid-cols-[1fr_7rem]">
                      <p className="text-sm font-bold sm:col-span-2">Add or update one player</p>
                      <input type="hidden" name="event_id" value={e.id} />
                      <NativeSelect name="player_id" aria-label="Player" required defaultValue="">
                        <option value="" disabled>Player</option>
                        {players.map((p) => <option key={p.id} value={p.id}>{p.name} {formatBomId(p.bom_id)}</option>)}
                      </NativeSelect>
                      <Input name="place" type="number" min={1} max={999} placeholder="Place (top 8)" aria-label="Place" />
                      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="tiger_king" /><Crown className="size-4 text-yellow-400" aria-hidden /> Tiger King (one per event)</label>
                      <Button type="submit" variant="outline" className="sm:col-span-2">Add or update player</Button>
                    </ActionForm>
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
