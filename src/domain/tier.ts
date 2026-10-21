export const TIERS = ["Ranked", "Major", "Championship"] as const;
export type Tier = (typeof TIERS)[number];
/** Competition levels shown to players; "Unrank" (casual and try) has no matches or points. */
export type TierLabel = Tier | "Unrank";
export const TIER_LABELS: readonly TierLabel[] = ["Unrank", ...TIERS];

export function parseTierLabel(value: unknown): TierLabel {
  if (typeof value !== "string" || !(TIER_LABELS as readonly string[]).includes(value)) throw new Error("Invalid competition type");
  return value as TierLabel;
}

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

export function parseTier(value: unknown): Tier {
  if (!isTier(value)) throw new Error(`Invalid tier: ${String(value)}`);
  return value;
}

/** Major and Championship belong to BOM as a whole, so they show the BOM logo, not a sub community's. */
export const usesBomLogo = (tier: TierLabel) => tier === "Major" || tier === "Championship";

/** The name shown for each level. The stored value of BK2 is still "Major"; it is shown as "Cup". */
export const TIER_NAME: Record<TierLabel, string> = { Unrank: "Unrank", Ranked: "Ranked", Major: "Cup", Championship: "Championship" };

/** The competition levels as BOM names them: BK4 (Unrank) up to BK1 (Championship). */
export const TIER_INFO: Record<TierLabel, { code: string; name: string; audience: string; tagline: string }> = {
  Unrank: { code: "BK4", name: "Beyblade of Medan Kompetisi Level 4", audience: "For Unranked Event", tagline: "Casual Gathering to Sharpen Your Skills" },
  Ranked: { code: "BK3", name: "Beyblade of Medan Kompetisi Level 3", audience: "For Weekly Ranked", tagline: "Weekly Gathering to become the best in leaderboard" },
  Major: { code: "BK2", name: "Beyblade of Medan Kompetisi Level 2", audience: "For Big Tournament", tagline: "Random Big Tournament with exciting prize, multiply points" },
  Championship: { code: "BK1", name: "Beyblade of Medan Kompetisi Level 1", audience: "For National Scale", tagline: "The Most Prestigious tournament with biggest prizes" },
};
