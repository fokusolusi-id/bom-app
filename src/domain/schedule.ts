export const GATHERING_TIME = "18:00";

const DAYS: [string, number][] = [["minggu", 0], ["senin", 1], ["selasa", 2], ["rabu", 3], ["kamis", 4], ["jumat", 5], ["jum'at", 5], ["sabtu", 6]];

/** Weekday (0 = Sunday) named in a free-text schedule such as "Sabtu malam", or null. */
export function parseWeekday(schedule: string): number | null {
  const s = schedule.toLowerCase();
  return DAYS.find(([name]) => s.includes(name))?.[1] ?? null;
}

export type Month = { year: number; month: number }; // month is 1-12

/** "2026-10" -> Month. Anything else returns the fallback. */
export function parseMonth(raw: string | undefined, fallback: Month): Month {
  const m = /^(\d{4})-(\d{2})$/.exec(raw ?? "");
  if (!m) return fallback;
  const month = Number(m[2]);
  const year = Number(m[1]);
  return month >= 1 && month <= 12 && year >= 2000 && year <= 2100 ? { year, month } : fallback;
}

export const monthKey = ({ year, month }: Month) => `${year}-${String(month).padStart(2, "0")}`;

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const i = year * 12 + (month - 1) + delta;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

/** Weeks of a month, Monday first. Each cell is a day of month, or null for padding. */
export function monthWeeks({ year, month }: Month): (number | null)[][] {
  const first = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array<null>(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export const weekdayOf = ({ year, month }: Month, day: number) => new Date(Date.UTC(year, month - 1, day)).getUTCDay();
