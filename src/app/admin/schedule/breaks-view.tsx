import { redirect } from "next/navigation";
import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaff } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { deleteScheduleEvent } from "../jadwal/actions";
import { EventForm } from "./event-form";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { BREAKS_HREF, ScheduleSideMenu } from "./side-menu";
import { ScheduleTabs } from "./schedule-tabs";

const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;

/** Breaks and holidays: days with no gathering. Each is only a date. Admins only. */
export async function BreaksView() {
  const staff = await requireStaff();
  if (!staff.isAdmin) redirect("/admin/schedule");
  const now = new Date();
  const [events, subs] = await Promise.all([supabaseScheduleEvents(staff.supabase).between(new Date(now.getTime() - 365 * DAY).toISOString(), new Date(now.getTime() + 2 * 365 * DAY).toISOString(), { includeInactive: true }), supabaseSubCommunities(staff.supabase).listAll()]);
  const breaks = events.filter((e) => e.tier === "Break").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const today = now.toISOString();
  return (
    <AdminPage title="Schedule" hint="Break and holiday days: no gathering, shown on the Schedule page and the homepage calendar. Only the date is needed.">
      <ScheduleTabs active="upcoming" />
      <div className="grid gap-8 md:grid-cols-[11rem_1fr]">
        <ScheduleSideMenu items={[
          { href: "/admin/schedule", label: "Upcoming Events", active: false },
          ...subs.flatMap((s) => (s.id ? [{ href: `/admin/schedule?c=${s.id}`, label: s.name, active: false }] : [])),
          { href: "/admin/schedule?c=bom", label: "BOM only", active: false },
          { href: BREAKS_HREF, label: "Break / Holiday", active: true },
        ]} />
        <div className="min-w-0 space-y-6">
        <AddCard title="New break / holiday"><EventForm communities={[]} types={["Break"]} allowBom /></AddCard>
        {breaks.length === 0 && <p className="text-muted-foreground text-sm">No breaks or holidays yet.</p>}
        <ItemGrid>
          {breaks.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle className="font-display text-xl leading-tight font-extrabold normal-case italic">
                  {day.format(new Date(e.starts_at))}
                  {e.starts_at < today && <span className="text-muted-foreground ml-2 text-sm font-normal normal-case not-italic">(past)</span>}
                  {!e.is_active && <span className="text-muted-foreground ml-2 text-sm font-normal normal-case not-italic">(hidden)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <EventForm e={e} communities={[]} types={["Break"]} allowBom />
                <ActionForm action={deleteScheduleEvent.bind(null, e.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
              </CardContent>
            </Card>
          ))}
        </ItemGrid>
        </div>
      </div>
    </AdminPage>
  );
}
