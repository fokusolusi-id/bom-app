import "server-only";
import { type NextEvent, todayWib, upcomingEvents } from "@/domain/next-event";
import { publicScheduleEvents } from "./schedule-events";
import { publicTournaments } from "./tournaments";

/** The next scheduled events (admin calendar) merged with scheduled tournaments, soonest first. */
export async function loadUpcomingEvents(limit: number, now = new Date()): Promise<NextEvent[]> {
  const [scheduled, tournaments] = await Promise.all([
    publicScheduleEvents().upcoming(now.toISOString(), limit),
    publicTournaments().upcoming(todayWib(now), limit),
  ]);
  return upcomingEvents({
    now, weekly: null, tournaments, limit,
    scheduled: scheduled.map((e) => ({ title: `${e.tier === "Unrank" ? "" : `BOM ${e.tier}: `}${e.name}`, at: new Date(e.starts_at) })),
  });
}
