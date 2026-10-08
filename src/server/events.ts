import "server-only";
import { type NextEvent, todayWib, upcomingEvents } from "@/domain/next-event";
import { GATHERING_TIME, parseWeekday } from "@/domain/schedule";
import type { SubCommunity } from "@/domain/sub-community";
import { publicTournaments } from "./tournaments";

const SATURDAY = 6;

/**
 * The next weekly Ranked sessions merged with scheduled tournaments.
 * The weekly Ranked exists while a sub komunitas meets on Saturday.
 */
export async function loadUpcomingEvents(subs: SubCommunity[], limit: number, now = new Date()): Promise<NextEvent[]> {
  const weekly = subs.some((s) => parseWeekday(s.schedule) === SATURDAY) ? { weekday: SATURDAY, time: GATHERING_TIME } : null;
  const tournaments = await publicTournaments().upcoming(todayWib(now), limit);
  return upcomingEvents({ now, weekly, tournaments, limit });
}
