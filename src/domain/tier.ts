export const TIERS = ["Ranked", "Cup", "Major", "Championship"] as const;
export type Tier = (typeof TIERS)[number];

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

export function parseTier(value: unknown): Tier {
  if (!isTier(value)) throw new Error(`Invalid tier: ${String(value)}`);
  return value;
}
