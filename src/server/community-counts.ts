import "server-only";
import { rankedDays } from "@/domain/event";
import { todayWib } from "@/domain/next-event";
import type { CommunityCounts } from "@/lib/content";
import { publicPlayers } from "./players";
import { publicScheduleEvents } from "./schedule-events";

const WEEK_MS = 7 * 86_400_000;

/**
 * The headline numbers from live data: active players, active sub communities, and how many different days this week
 * (today through the next six days, Medan time) have a Ranked gathering.
 */
export async function loadCommunityCounts(subCommunities: number, now = new Date()): Promise<CommunityCounts> {
  const from = new Date(`${todayWib(now)}T00:00:00+07:00`);
  const [players, events] = await Promise.all([
    publicPlayers().repo.list(1000),
    publicScheduleEvents().between(from.toISOString(), new Date(from.getTime() + WEEK_MS).toISOString()),
  ]);
  return { members: players.length, subCommunities, weeklyRanked: rankedDays(events) };
}
