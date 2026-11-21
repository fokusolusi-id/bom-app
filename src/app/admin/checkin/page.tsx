import { AdminSection, AdminSectionsPage } from "@/components/admin/admin-page";
import { canManageEvent } from "@/domain/access";
import type { TierLabel } from "@/domain/tier";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { requireStaff } from "@/server/admin-session";
import { supabaseCheckins } from "@/server/checkins";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { CheckinBrowser, type CheckinEvent } from "./checkin-browser";

export const metadata = { title: "Check-in | Admin Beyblade of Medan" };

const DAY = 86_400_000;

/** Pick the tournament to take check-ins for: every event up to two months ahead, newest first, with how many are checked in. */
export default async function CheckinPage() {
  const staff = await requireStaff();
  const until = new Date(new Date().getTime() + 60 * DAY).toISOString();
  const all = await supabaseScheduleEvents(staff.supabase).between("2020-01-01T00:00:00Z", until, { includeInactive: true });
  const allowed = all.filter((e) => e.id && e.tier !== "Break" && canManageEvent(staff, e)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const counts = await supabaseCheckins(staff.supabase).countsForEvents(allowed.map((e) => e.id!));
  const events: CheckinEvent[] = allowed.map((e) => ({
    id: e.id!, name: e.name, tier: e.tier as TierLabel, startsAt: e.starts_at, communityId: e.sub_community_id, communityName: e.community?.name ?? "Beyblade of Medan",
    logo: e.community?.image_path ? { src: mediaUrl(e.community.image_path), alt: e.community.name } : { src: BOM_LOGO, alt: "Beyblade of Medan" },
    checkedIn: counts.get(e.id!) ?? 0,
  }));
  return (
    <AdminSectionsPage title="Check-in" hint="Scan each player's member card at the gate and register their combos." sections={[["events", "Events"]]}>
      <AdminSection id="events" title="Events" hint="Filter by competition type and sub community, then open a tournament with the pencil to check players in.">
        <CheckinBrowser events={events} />
      </AdminSection>
    </AdminSectionsPage>
  );
}
