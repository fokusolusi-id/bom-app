import type { Tier } from "./tier";

export const WIN_POINTS = 30;
export const LOSS_POINTS = 10;

/** Ranked counts once; Cup, Major and Championship count double. */
export function tierMultiplier(tier: Tier): 1 | 2 {
  return tier === "Ranked" ? 1 : 2;
}

export function pointsFor(tier: Tier): { winner: number; loser: number } {
  const m = tierMultiplier(tier);
  return { winner: WIN_POINTS * m, loser: LOSS_POINTS * m };
}

export function clampScore(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export type Side = "a" | "b";
export type Outcome = Side | "draw";

export function outcome(aScore: number, bScore: number): Outcome {
  if (aScore > bScore) return "a";
  if (bScore > aScore) return "b";
  return "draw";
}
