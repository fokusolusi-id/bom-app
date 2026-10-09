export const TIERS = ["Ranked", "Cup", "Major", "Championship"] as const;
export type Tier = (typeof TIERS)[number];
/** Competition levels shown to players; "Unrank" (casual and try) has no matches or points. */
export type TierLabel = Tier | "Unrank";

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

export function parseTier(value: unknown): Tier {
  if (!isTier(value)) throw new Error(`Invalid tier: ${String(value)}`);
  return value;
}
