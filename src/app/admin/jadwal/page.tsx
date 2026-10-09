import Link from "next/link";
import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";
import { TierBadge } from "@/components/bom/tier-badge";
import { ActionForm } from "@/components/form/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { EVENT_TYPES, isoToWibLocal, type ScheduleEventView } from "@/domain/event";
import { VENUE } from "@/lib/venue";
import { requireAdmin } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { cn } from "@/lib/utils";
import { deleteScheduleEvent, saveScheduleEvent } from "./actions";

export const metadata = { title: "Schedule | Admin BOM" };

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;

function EventForm({ e, communities, defaultCommunity }: { e?: ScheduleEventView; communities: { id: string; name: string }[]; defaultCommunity?: string }) {
  return (
    <ActionForm action={saveScheduleEvent} resetOnSuccess={!e} className="grid gap-3 sm:grid-cols-2">
      {e?.id && <input type="hidden" name="id" value={e.id} />}
      <Input name="name" defaultValue={e?.name} placeholder="Event name (e.g. Weekly Ranked)" aria-label="Event name" maxLength={80} required className="sm:col-span-2" />
      <NativeSelect name="sub_community_id" aria-label="Community" defaultValue={e ? (e.sub_community_id ?? "") : (defaultCommunity ?? "")}>
        <option value="">All communities (BOM)</option>
        {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </NativeSelect>
      <NativeSelect name="tier" aria-label="Competition type" defaultValue={e?.tier ?? "Ranked"}>
        {EVENT_TYPES.map((t) => <option key={t} value={t}>{t === "Break" ? "Libur / Break" : `BOM ${t}`}</option>)}
      </NativeSelect>
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">Date and time (WIB)
        <Input name="starts_at" type="datetime-local" defaultValue={e ? isoToWibLocal(e.starts_at) : ""} required className="text-base text-white" />
      </label>
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">Place
        <Input name="place" defaultValue={e?.place ?? VENUE} maxLength={120} required className="text-base text-white" />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={e?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{e ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

/** Filter value for events that belong to BOM as a whole rather than one sub community. */
const BOM = "bom";

export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const supabase = await requireAdmin();
  const now = new Date();
  const from = new Date(now.getTime() - 30 * DAY).toISOString();
  const to = new Date(now.getTime() + 365 * DAY).toISOString();
  const [events, subs] = await Promise.all([
    supabaseScheduleEvents(supabase).between(from, to, { includeInactive: true }),
    supabaseSubCommunities(supabase).listAll(),
  ]);
  const communities = subs.flatMap((s) => (s.id ? [{ id: s.id, name: s.name }] : []));
  // One komunitas at a time: the list is filtered by ?c=<id> (or "bom" for events without a community).
  const requested = (await searchParams).c;
  const filter = requested === BOM || communities.some((c) => c.id === requested) ? requested! : (communities[0]?.id ?? BOM);
  const shown = events.filter((e) => (filter === BOM ? e.sub_community_id === null : e.sub_community_id === filter));
  const chips = [...communities.map((c) => ({ key: c.id, label: c.name })), { key: BOM, label: "BOM (all)" }];
  return (
    <AdminPage title="Schedule" hint="Events on the Schedule page and the homepage. Shows the last 30 days up to one year ahead.">
      <nav aria-label="Community" className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.key} href={`/admin/jadwal?c=${c.key}`} aria-current={c.key === filter ? "page" : undefined}
            className={cn("font-label rounded border px-3 py-1.5 text-sm font-bold uppercase italic", c.key === filter ? "text-primary border-primary" : "hover:text-primary")}
          >{c.label}</Link>
        ))}
      </nav>
      <AddCard title="New event"><EventForm communities={communities} defaultCommunity={filter === BOM ? "" : filter} /></AddCard>
      {shown.length === 0 && <p className="text-muted-foreground text-sm">No events for this selection yet.</p>}
      <ItemGrid>
        {shown.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {e.tier === "Break" ? <Badge variant="muted">Libur / Break</Badge> : <TierBadge tier={e.tier} className="w-auto" />}{e.name}
                {!e.is_active && <span className="text-muted-foreground text-sm">(disembunyikan)</span>}
              </CardTitle>
              <p className="text-muted-foreground text-sm">{when.format(new Date(e.starts_at))} WIB · {e.community?.name ?? "BOM"}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <EventForm e={e} communities={communities} />
              <ActionForm action={deleteScheduleEvent.bind(null, e.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
            </CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminPage>
  );
}
