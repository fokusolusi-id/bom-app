import type { Tier } from "./tier";

/** Ranked and Cup count 1x, Major 1.5x and Championship 2x. */
const MULTIPLIER: Record<Tier, number> = { Ranked: 1, Cup: 1, Major: 1.5, Championship: 2 };

export function tierMultiplier(tier: Tier): number {
  return MULTIPLIER[tier];
}
