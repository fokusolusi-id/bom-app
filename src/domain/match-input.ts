import { parseTier, type Tier } from "./tier";
import { isUuid, parseText } from "./validation";

export type MatchInput = {
  tier: Tier; round: string; stadium: string; target: number; aId: string; bId: string;
};

export function parseMatchInput(get: (key: string) => unknown): MatchInput {
  const aId = get("a_id");
  const bId = get("b_id");
  if (!isUuid(aId) || !isUuid(bId)) throw new Error("Pick two bladers");
  if (aId === bId) throw new Error("Blader A and B must be different");
  const target = Number(get("target") ?? 4);
  if (!Number.isInteger(target) || target < 1 || target > 10) throw new Error("Target must be 1-10");
  return {
    tier: parseTier(get("tier") ?? "Ranked"),
    round: parseText(get("round"), "Round", 40, "Round 1"),
    stadium: parseText(get("stadium"), "Stadium", 40, "Stadium 1"),
    target, aId, bId,
  };
}
