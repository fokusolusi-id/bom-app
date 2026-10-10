import type { PointsTable } from "./points-table";
import { tierMultiplier } from "./scoring";
import { isTier } from "./tier";

/** One player at one event: `place` is empty outside the top places. */
export type Participation = { playerId: string | null; place: number | null; tigerKing: boolean };
export type ScoredEvent = { id: string; name: string; challongeUrl?: string | null; tier: string; startsAt: string; participants: Participation[] };
export type Standing = { total: number; week: number; rank: number; previousRank: number | null; tigerKings: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Column of the points table for this many participants. Columns are headed by their lower bound ("< 39", "40", "50"...),
 * so 39 players use the first column and 40 the second.
 */
export function sizeColumn(sizes: string[], count: number): number {
  let col = 0;
  sizes.forEach((s, i) => {
    const bound = Number(/\d+/.exec(s)?.[0]);
    if (i > 0 && Number.isFinite(bound) && count >= bound) col = i;
  });
  return col;
}

/**
 * Points of one player at one event: Participant always, plus the points for the place, Top Cut for places after the
 * first four, and Tiger King when awarded. The sum is multiplied by the competition level (Cup 2x, Major 3x, Championship 4x).
 */
export function eventPoints(table: PointsTable, tier: string, p: Pick<Participation, "place" | "tigerKing">, participants: number): number {
  if (!isTier(tier)) return 0;
  const col = sizeColumn(table.sizes, participants);
  const category = (label: string) => table.categories.find((c) => c.label.toLowerCase() === label)?.values[col] ?? 0;
  let points = category("participant");
  if (p.place !== null) {
    const row = table.ranks.find((r) => r.label === String(p.place));
    points += row?.values[col] ?? 0;
    if (row && p.place > 4) points += category("top cut");
  }
  if (p.tigerKing) points += category("tiger king");
  return round2(points * tierMultiplier(tier));
}

/** Monday (WIB) of the week an event falls in, as YYYY-MM-DD. */
export function weekStart(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 7 * 3_600_000);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function totalsOf(events: ScoredEvent[], table: PointsTable): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of events) {
    // Guests (no player) count as participants but earn nothing here: they are not on the leaderboard.
    for (const p of e.participants) if (p.playerId) totals.set(p.playerId, round2((totals.get(p.playerId) ?? 0) + eventPoints(table, e.tier, p, e.participants.length)));
  }
  return totals;
}

function rankOf(totals: Map<string, number>): Map<string, number> {
  const values = [...totals.values()];
  return new Map([...totals].map(([id, t]) => [id, 1 + values.filter((v) => v > t).length]));
}

/**
 * Standings from the results of past events. `total` adds every event; `week` is what the player earned in the latest
 * week with results; `previousRank` is their position before that week (empty if they had no points yet).
 */
export function buildStandings(events: ScoredEvent[], table: PointsTable): Map<string, Standing> {
  const latest = events.reduce((max, e) => (weekStart(e.startsAt) > max ? weekStart(e.startsAt) : max), "");
  const inLatest = events.filter((e) => weekStart(e.startsAt) === latest);
  const totals = totalsOf(events, table);
  const week = totalsOf(inLatest, table);
  const before = totalsOf(events.filter((e) => weekStart(e.startsAt) !== latest), table);
  const ranks = rankOf(totals);
  const previous = rankOf(new Map([...before].filter(([, t]) => t > 0)));
  const crowns = new Map<string, number>();
  for (const e of events) for (const p of e.participants) if (p.playerId && p.tigerKing && isTier(e.tier)) crowns.set(p.playerId, (crowns.get(p.playerId) ?? 0) + 1);
  return new Map([...totals].map(([id, total]) => [id, { total, week: week.get(id) ?? 0, rank: ranks.get(id)!, previousRank: previous.get(id) ?? null, tigerKings: crowns.get(id) ?? 0 }]));
}

/** One event of a player's history, with the points it gave and their running total after it. */
export type HistoryRow = { eventId: string; name: string; challongeUrl: string | null; tier: string; startsAt: string; place: number | null; tigerKing: boolean; points: number; participants: number; total: number };

/** Every scored event the player took part in, oldest first. */
export function playerHistory(events: ScoredEvent[], table: PointsTable, playerId: string): HistoryRow[] {
  let total = 0;
  return [...events]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .flatMap((e) => {
      const me = e.participants.find((p) => p.playerId === playerId);
      if (!me) return [];
      const points = eventPoints(table, e.tier, me, e.participants.length);
      total = round2(total + points);
      return [{ eventId: e.id, name: e.name, challongeUrl: e.challongeUrl ?? null, tier: e.tier, startsAt: e.startsAt, place: me.place, tigerKing: me.tigerKing, points, participants: e.participants.length, total }];
    });
}
