import type { Tier } from "./tier";

/** Ranked counts 1x, Major 1.5x and Championship 2x. */
const MULTIPLIER: Record<Tier, number> = { Ranked: 1, Major: 1.5, Championship: 2 };

export function tierMultiplier(tier: Tier): number {
  return MULTIPLIER[tier];
}
