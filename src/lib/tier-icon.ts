import type { TierLabel } from "@/domain/tier";

/** Bomb icon of each competition level (public/competition-path). */
export const TIER_ICON: Record<TierLabel, string> = {
  Unrank: "/competition-path/0-bom-unrank.png",
  Ranked: "/competition-path/1-bom-rank.png",
  Major: "/competition-path/3-bom-major.png",
  Championship: "/competition-path/4-bomb-championship.png",
};

export const BOM_LOGO = "/brand/logo-768.png";
