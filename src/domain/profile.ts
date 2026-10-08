import { outcome, pointsFor } from "./scoring";
import type { Match } from "./types";

export type Result = "win" | "loss" | "draw";

export type MatchHistoryRow = {
  id: string; at: string; tier: Match["tier"]; round: string;
  opponent: string; score: number; opponentScore: number; result: Result;
  combo: string | null; opponentCombo: string | null;
};

/** URL ids look like "bom-001". Returns the trimmed id, or null when it can't be a BOM ID. */
export function normalizeBomId(raw: string): string | null {
  const v = raw.trim();
  return /^[A-Za-z0-9-]{1,20}$/.test(v) ? v : null;
}

export function resultFor(match: Pick<Match, "a_id" | "a_score" | "b_score">, playerId: string): Result {
  const o = outcome(match.a_score, match.b_score);
  if (o === "draw") return "draw";
  return (o === "a") === (match.a_id === playerId) ? "win" : "loss";
}

/** Finished matches of one player, newest first, from the player's point of view. */
export function matchHistory(matches: Match[], playerId: string): MatchHistoryRow[] {
  return matches
    .filter((m) => m.status === "finished" && (m.a_id === playerId || m.b_id === playerId))
    .map((m) => {
      const isA = m.a_id === playerId;
      return {
        id: m.id,
        at: m.updated_at ?? "",
        tier: m.tier,
        round: m.round,
        opponent: isA ? m.b_name : m.a_name,
        score: isA ? m.a_score : m.b_score,
        opponentScore: isA ? m.b_score : m.a_score,
        result: resultFor(m, playerId),
        combo: (isA ? m.a_combo : m.b_combo) ?? null,
        opponentCombo: (isA ? m.b_combo : m.a_combo) ?? null,
      };
    })
    .sort((x, y) => y.at.localeCompare(x.at));
}

/**
 * Cumulative points after each match, oldest first, replaying finish_match:
 * only decided matches between two known players award points.
 */
export function pointsSeries(matches: Match[], playerId: string): { at: string; points: number }[] {
  let total = 0;
  const series: { at: string; points: number }[] = [];
  const own = matches
    .filter((m) => m.status === "finished" && m.a_id && m.b_id && (m.a_id === playerId || m.b_id === playerId))
    .sort((x, y) => (x.updated_at ?? "").localeCompare(y.updated_at ?? ""));
  for (const m of own) {
    const result = resultFor(m, playerId);
    if (result === "draw") continue;
    const { winner, loser } = pointsFor(m.tier);
    total += result === "win" ? winner : loser;
    series.push({ at: m.updated_at ?? "", points: total });
  }
  return series;
}

/** Share of decided matches won, 0-100. */
export function winRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total === 0 ? 0 : Math.round((wins / total) * 100);
}

/** 1-based leaderboard position; ties share the better rank. */
export function rankOf(points: number, allPoints: number[]): number {
  return allPoints.filter((p) => p > points).length + 1;
}
