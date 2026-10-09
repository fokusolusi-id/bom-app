import type { Tier } from "./tier";

export const WIN_POINTS = 30;
export const LOSS_POINTS = 10;

/** Ranked counts 1x, Cup 2x, Major 3x and Championship 4x. */
const MULTIPLIER: Record<Tier, 1 | 2 | 3 | 4> = { Ranked: 1, Cup: 2, Major: 3, Championship: 4 };

export function tierMultiplier(tier: Tier): 1 | 2 | 3 | 4 {
  return MULTIPLIER[tier];
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
