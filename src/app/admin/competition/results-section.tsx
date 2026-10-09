import { AdminSection, ItemGrid } from "@/components/admin/admin-page";
import { TierBadge } from "@/components/bom/tier-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { formatBomId } from "@/domain/profile";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { removePlacement, setPlacement } from "./actions";

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;
const BIG = ["Cup", "Major", "Championship"];

/** Final places for the big events of the schedule (Cup, Major, Championship). The events themselves are added under Schedule. */
export async function ResultsSection() {
  const supabase = await requireAdmin();
  const now = new Date();
  const [all, players] = await Promise.all([
    supabaseScheduleEvents(supabase).between(new Date(now.getTime() - 365 * DAY).toISOString(), new Date(now.getTime() + 365 * DAY).toISOString(), { includeInactive: true }),
    supabasePlayers(supabase).list(1000, { includeRegistered: true }),
  ]);
  const events = all.filter((e) => BIG.includes(e.tier)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const placements = await supabaseResults(supabase).placementsForEvents(events.flatMap((e) => (e.id ? [e.id] : [])));
  const byId = new Map(players.map((p) => [p.id, p]));
  return (
    <AdminSection id="results" title="Results" hint="Final places for Cup, Major and Championship events. Add the event itself under Schedule; the last year and the next year are listed here.">
      {events.length === 0 && <p className="text-muted-foreground text-sm">No Cup, Major or Championship events in the schedule yet.</p>}
      <ItemGrid>
        {events.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base"><TierBadge tier={e.tier === "Break" ? "Cup" : e.tier} className="w-auto" />{e.name}</CardTitle>
              <p className="text-muted-foreground text-sm">{when.format(new Date(e.starts_at))}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {placements.filter((p) => p.event_id === e.id).sort((a, b) => a.place - b.place).map((pl) => (
                  <li key={pl.player_id} className="flex items-center justify-between">
                    <span><span className="text-primary font-bold">#{pl.place}</span> {byId.get(pl.player_id)?.name ?? pl.player_id}</span>
                    <ActionForm action={removePlacement.bind(null, e.id!, pl.player_id)}><Button variant="outline" size="sm">Remove</Button></ActionForm>
                  </li>
                ))}
              </ul>
              <ActionForm action={setPlacement} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_6rem_auto]">
                <input type="hidden" name="event_id" value={e.id} />
                <NativeSelect name="player_id" aria-label="Player" required defaultValue="">
                  <option value="" disabled>Player</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.name} {formatBomId(p.bom_id)}</option>)}
                </NativeSelect>
                <Input name="place" type="number" min={1} max={999} placeholder="Place" aria-label="Place" required />
                <Button type="submit">Set place</Button>
              </ActionForm>
            </CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminSection>
  );
}
