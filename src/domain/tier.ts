export const TIERS = ["Ranked", "Cup", "Major", "Championship"] as const;
export type Tier = (typeof TIERS)[number];
/** Competition levels shown to players; "Unrank" (casual and try) has no matches or points. */
export type TierLabel = Tier | "Unrank";
export const TIER_LABELS: readonly TierLabel[] = ["Unrank", ...TIERS];

export function parseTierLabel(value: unknown): TierLabel {
  if (typeof value !== "string" || !(TIER_LABELS as readonly string[]).includes(value)) throw new Error("Jenis kompetisi tidak valid");
  return value as TierLabel;
}

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

export function parseTier(value: unknown): Tier {
  if (!isTier(value)) throw new Error(`Invalid tier: ${String(value)}`);
  return value;
}

/** Cup, Major and Championship belong to BOM as a whole, so they show the BOM logo, not a sub community's. */
export const usesBomLogo = (tier: TierLabel) => tier === "Cup" || tier === "Major" || tier === "Championship";
