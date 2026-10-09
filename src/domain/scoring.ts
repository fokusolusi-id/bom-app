import type { Tier } from "./tier";

/** Ranked counts 1x, Cup 2x, Major 3x and Championship 4x. */
const MULTIPLIER: Record<Tier, 1 | 2 | 3 | 4> = { Ranked: 1, Cup: 2, Major: 3, Championship: 4 };

export function tierMultiplier(tier: Tier): 1 | 2 | 3 | 4 {
  return MULTIPLIER[tier];
}
