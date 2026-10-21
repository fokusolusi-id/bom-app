import { TIER_INFO, TIER_NAME } from "@/domain/tier";
import "server-only";
import { eventPlace, eventUsesBomLogo, pickOnePerDay } from "@/domain/event";
import { type NextEvent, upcomingEvents } from "@/domain/next-event";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { VENUE } from "@/lib/venue";
import { publicScheduleEvents } from "./schedule-events";

/** The next scheduled events (admin calendar, one per day), soonest first. */
export async function loadUpcomingEvents(limit: number, now = new Date()): Promise<NextEvent[]> {
  const scheduled = await publicScheduleEvents().upcoming(now.toISOString(), limit * 12);
  return upcomingEvents({
    now, weekly: null, limit,
    scheduled: pickOnePerDay(scheduled).map((e) => {
      const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
      return {
        title: `${e.tier === "Unrank" ? "" : e.tier === "Break" ? "Break: " : `${TIER_INFO[e.tier].code} ${TIER_NAME[e.tier]}: `}${e.name}`,
        at: new Date(e.starts_at), name: e.name, type: e.tier, place: eventPlace(e, VENUE), challongeUrl: e.challonge_url ?? null,
        logo: bom ? { src: BOM_LOGO, alt: "Beyblade of Medan" } : { src: mediaUrl(e.community!.image_path!), alt: e.community!.name },
      };
    }),
  });
}
