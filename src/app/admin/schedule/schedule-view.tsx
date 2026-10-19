import Link from "next/link";
import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";
import { TierMark } from "@/components/bom/tier-mark";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORGANIZER_EVENT_TYPES, canManageEvent } from "@/domain/access";
import { EVENT_TYPES, eventPlace } from "@/domain/event";
import { VENUE } from "@/lib/venue";
import { requireStaff } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { cn } from "@/lib/utils";
import { deleteScheduleEvent } from "../jadwal/actions";
import { EventForm } from "./event-form";
import { BREAKS_HREF, ScheduleSideMenu, startOfTodayWib } from "./side-menu";
import { ScheduleTabs } from "./schedule-tabs";

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
const dayOnly = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;

/** Filter value for events that belong to BOM as a whole rather than one sub community. */
const BOM = "bom";
/** Filter value for every event, whatever its community. The default. */
const ALL = "all";

export async function ScheduleView({ community, type }: { community?: string; type?: string }) {
  const staff = await requireStaff();
  const supabase = staff.supabase;
  const now = new Date();
  // Upcoming events from today on; everything before today is under the Past Events tab.
  const from = startOfTodayWib(now).toISOString();
  const to = new Date(now.getTime() + 365 * DAY).toISOString();
  const [events, subs] = await Promise.all([
    supabaseScheduleEvents(supabase).between(from, to, { includeInactive: true }),
    supabaseSubCommunities(supabase).listAll(),
  ]);
  // Organizers see and manage only their own sub communities; admins see them all.
  const communities = subs.flatMap((s) => (s.id && (staff.isAdmin || staff.communityIds.includes(s.id)) ? [{ id: s.id, name: s.name }] : []));
  // Breaks and holidays have their own tab, so the events tab has no Break type.
  const types = (staff.isAdmin ? EVENT_TYPES : ORGANIZER_EVENT_TYPES).filter((t) => t !== "Break");
  // All events by default; ?c=<id> narrows it to one community, ?c=bom to events without a community.
  const requested = community;
  const filter = requested === BOM || communities.some((c) => c.id === requested) ? requested! : ALL;
  const typeFilter = types.find((t) => t === type) ?? null;
  const shown = events
    .filter((e) => e.tier !== "Break")
    .filter((e) => staff.isAdmin || (e.sub_community_id !== null && staff.communityIds.includes(e.sub_community_id)))
    .filter((e) => (filter === ALL ? true : filter === BOM ? e.sub_community_id === null : e.sub_community_id === filter))
    .filter((e) => typeFilter === null || e.tier === typeFilter);
  /** Links keep the other filter: picking a community keeps the type, and the other way round. */
  const href = (c: string, t: string | null) => {
    const q = new URLSearchParams();
    if (c !== ALL) q.set("c", c);
    if (t) q.set("t", t);
    return q.size ? `/admin/schedule?${q}` : "/admin/schedule";
  };
  const chips = [{ key: ALL, label: "Upcoming Events" }, ...communities.map((c) => ({ key: c.id, label: c.name })), ...(staff.isAdmin ? [{ key: BOM, label: "Beyblade of Medan only" }] : [])];
  return (
    <AdminPage title="Schedule" hint="Upcoming events on the Schedule page and the homepage, from today up to one year ahead. Past events are under the Past Events tab.">
      <ScheduleTabs active="upcoming" />
      <div className="grid gap-8 md:grid-cols-[11rem_1fr]">
        <ScheduleSideMenu items={[
          ...chips.map((c) => ({ href: href(c.key, typeFilter), label: c.label, active: c.key === filter })),
          ...(staff.isAdmin ? [{ href: BREAKS_HREF, label: "Break / Holiday", active: false }] : []),
        ]} />
        <div className="min-w-0 space-y-6">
      <AddCard title="New event"><EventForm communities={communities} types={types} allowBom={staff.isAdmin} defaultCommunity={filter === BOM || filter === ALL ? (staff.isAdmin ? "" : communities[0]?.id) : filter} /></AddCard>
      <nav aria-label="Competition type" className="flex flex-wrap gap-2">
        {[null, ...types].map((t) => (
          <Link
            key={t ?? "all"} href={href(filter, t)} aria-current={t === typeFilter ? "page" : undefined}
            className={cn("font-label rounded border px-3 py-1.5 text-sm font-bold uppercase italic", t === typeFilter ? "text-primary border-primary" : "hover:text-primary")}
          >{t ? EVENT_TYPE_LABEL(t) : "All types"}</Link>
        ))}
      </nav>
      {shown.length === 0 && <p className="text-muted-foreground text-sm">No events for this selection yet.</p>}
      <ItemGrid>
        {shown.map((e) => (
          <Card key={e.id}>
            <CardHeader className="space-y-2">
              <TierMark tier={e.tier} tileClassName="size-12" className="text-lg" />
              <CardTitle className="font-display text-2xl leading-tight font-extrabold normal-case italic">
                {e.name}
                {!e.is_active && <span className="text-muted-foreground ml-2 text-sm font-normal normal-case not-italic">(hidden)</span>}
              </CardTitle>
              <p className="text-muted-foreground text-sm">{e.tier === "Break" ? dayOnly.format(new Date(e.starts_at)) : `${when.format(new Date(e.starts_at))} WIB · ${e.community?.name ?? "Beyblade of Medan"} · ${eventPlace(e, VENUE)}`}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {canManageEvent(staff, e) ? (
                <>
                  <EventForm e={e} communities={communities} types={types} allowBom={staff.isAdmin} />
                  <ActionForm action={deleteScheduleEvent.bind(null, e.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
                </>
              ) : <p className="text-muted-foreground text-sm">Only an admin can change this event.</p>}
            </CardContent>
          </Card>
        ))}
      </ItemGrid>
        </div>
      </div>
    </AdminPage>
  );
}
