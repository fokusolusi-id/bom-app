import { AdminPage } from "@/components/admin/admin-page";
import { ORGANIZER_EVENT_TYPES, canManageEvent } from "@/domain/access";
import { EVENT_TYPES } from "@/domain/event";
import { requireStaff } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { ArchiveBrowser, type ArchiveEvent } from "./archive-browser";
import { ScheduleTabs } from "./schedule-tabs";
import { PAST_HREF, ScheduleSideMenu, startOfTodayWib } from "./side-menu";

/** The Past Events tab: everything before today, newest first. Open one to correct it. */
export async function ArchivesView({ community }: { community?: string }) {
  const staff = await requireStaff();
  const [events, subs] = await Promise.all([
    supabaseScheduleEvents(staff.supabase).between("2020-01-01T00:00:00Z", startOfTodayWib().toISOString(), { includeInactive: true }),
    supabaseSubCommunities(staff.supabase).listAll(),
  ]);
  const communities = subs.flatMap((s) => (s.id && (staff.isAdmin || staff.communityIds.includes(s.id)) ? [{ id: s.id, name: s.name }] : []));
  const types = (staff.isAdmin ? EVENT_TYPES : ORGANIZER_EVENT_TYPES).filter((t) => t !== "Break");
  // The vertical menu narrows the list by sub community, like on the Upcoming Events tab.
  const filter = community === "bom" || communities.some((c) => c.id === community) ? community! : "all";
  const rows: ArchiveEvent[] = events
    // Organizers see only their own sub communities' events, and breaks have their own page.
    .filter((e) => e.tier !== "Break" && (staff.isAdmin || (e.sub_community_id !== null && staff.communityIds.includes(e.sub_community_id))))
    .filter((e) => (filter === "all" ? true : filter === "bom" ? e.sub_community_id === null : e.sub_community_id === filter))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .flatMap((e) => (e.id ? [{ event: e, editable: canManageEvent(staff, e) }] : []));
  return (
    <AdminPage title="Schedule" hint="Events before today, newest first. Open one to correct it; add results under Leaderboard.">
      <ScheduleTabs active="past" />
      <div className="grid gap-8 md:grid-cols-[11rem_1fr]">
        <ScheduleSideMenu items={[
          { href: PAST_HREF, label: "Past Events", active: filter === "all" },
          ...communities.map((c) => ({ href: `${PAST_HREF}&c=${c.id}`, label: c.name, active: filter === c.id })),
          ...(staff.isAdmin ? [{ href: `${PAST_HREF}&c=bom`, label: "Beyblade of Medan only", active: filter === "bom" }] : []),
        ]} />
        <div className="min-w-0">
          <ArchiveBrowser key={filter} rows={rows} communities={communities} types={types} allowBom={staff.isAdmin} />
        </div>
      </div>
    </AdminPage>
  );
}
