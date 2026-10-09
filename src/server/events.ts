import "server-only";
import { eventUsesBomLogo, pickOnePerDay } from "@/domain/event";
import { type NextEvent, todayWib, upcomingEvents } from "@/domain/next-event";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { publicScheduleEvents } from "./schedule-events";
import { publicTournaments } from "./tournaments";

/** The next scheduled events (admin calendar, one per day) merged with scheduled tournaments, soonest first. */
export async function loadUpcomingEvents(limit: number, now = new Date()): Promise<NextEvent[]> {
  const [scheduled, tournaments] = await Promise.all([
    publicScheduleEvents().upcoming(now.toISOString(), limit * 12),
    publicTournaments().upcoming(todayWib(now), limit),
  ]);
  return upcomingEvents({
    now, weekly: null, tournaments, limit,
    scheduled: pickOnePerDay(scheduled).map((e) => {
      const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
      return {
        title: `${e.tier === "Unrank" ? "" : e.tier === "Break" ? "Break: " : `BOM ${e.tier}: `}${e.name}`,
        at: new Date(e.starts_at), name: e.name, type: e.tier, place: e.place,
        logo: bom ? { src: BOM_LOGO, alt: "BOM" } : { src: mediaUrl(e.community!.image_path!), alt: e.community!.name },
      };
    }),
  });
}
