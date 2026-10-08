export const WIB_OFFSET_HOURS = 7; // Medan has no DST.
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** The next occurrence (strictly in the future) of `weekday` (0 = Sunday) at `time` ("18:00") in WIB. */
export function nextWeekly(now: Date, weekday: number, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const wib = new Date(now.getTime() + WIB_OFFSET_HOURS * HOUR_MS);
  let ahead = (weekday - wib.getUTCDay() + 7) % 7;
  const minutesNow = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  if (ahead === 0 && minutesNow >= h * 60 + m) ahead = 7;
  const dayStart = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate());
  return new Date(dayStart + ahead * DAY_MS + (h * 60 + m) * 60_000 - WIB_OFFSET_HOURS * HOUR_MS);
}

export type NextEvent = { title: string; at: Date; hasTime: boolean };

/**
 * The soonest of the weekly Ranked (when a weekly slot exists) and the next scheduled tournament.
 * Tournaments only have a date, so they start at 00:00 WIB and carry `hasTime: false`.
 * A tournament today still counts. Returns null when there is nothing to show.
 */
export function pickNextEvent(opts: {
  now: Date;
  weekly: { weekday: number; time: string } | null;
  tournament: { name: string; tier: string; held_on: string } | null;
}): NextEvent | null {
  const { now, weekly, tournament } = opts;
  const candidates: NextEvent[] = [];
  if (weekly) candidates.push({ title: "Next Ranked", at: nextWeekly(now, weekly.weekday, weekly.time), hasTime: true });
  if (tournament) {
    const at = new Date(`${tournament.held_on}T00:00:00+07:00`);
    const endOfDay = at.getTime() + DAY_MS;
    if (!Number.isNaN(at.getTime()) && endOfDay > now.getTime()) {
      candidates.push({ title: `Next ${tournament.tier}: ${tournament.name}`, at, hasTime: false });
    }
  }
  return candidates.sort((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null;
}
