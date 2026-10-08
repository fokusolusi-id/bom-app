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
 * Upcoming events, soonest first: the next weekly Ranked sessions (when a weekly slot exists) merged with
 * scheduled tournaments. Tournaments only have a date, so they start at 00:00 WIB and carry `hasTime: false`.
 * A tournament today still counts.
 */
export function upcomingEvents(opts: {
  now: Date;
  weekly: { weekday: number; time: string } | null;
  tournaments: { name: string; tier: string; held_on: string }[];
  limit: number;
}): NextEvent[] {
  const { now, weekly, tournaments, limit } = opts;
  const events: NextEvent[] = [];
  if (weekly) {
    let from = now;
    for (let i = 0; i < limit; i++) {
      const at = nextWeekly(from, weekly.weekday, weekly.time);
      events.push({ title: "Ranked", at, hasTime: true });
      from = at;
    }
  }
  for (const t of tournaments) {
    const at = new Date(`${t.held_on}T00:00:00+07:00`);
    if (!Number.isNaN(at.getTime()) && at.getTime() + DAY_MS > now.getTime()) events.push({ title: `${t.tier}: ${t.name}`, at, hasTime: false });
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, limit);
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });

/** "Saturday 10 October, 18:00 WIB" (tournaments have no time, so just the day). */
export function formatWhen(e: NextEvent): string {
  return `${dayFmt.format(e.at)}${e.hasTime ? `, ${timeFmt.format(e.at)} WIB` : ""}`;
}

/** Today's date in Medan as YYYY-MM-DD. */
export const todayWib = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
