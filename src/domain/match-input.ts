import { parseTier, type Tier } from "./tier";

export type MatchInput = {
  tier: Tier; round: string; stadium: string; target: number; aId: string; bId: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

function text(raw: unknown, fallback: string, max = 40): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return fallback;
  if (v.length > max) throw new Error(`Text too long (max ${max})`);
  return v;
}

export function parseMatchInput(get: (key: string) => unknown): MatchInput {
  const aId = get("a_id");
  const bId = get("b_id");
  if (!isUuid(aId) || !isUuid(bId)) throw new Error("Pilih dua blader");
  if (aId === bId) throw new Error("Blader A dan B harus berbeda");
  const target = Number(get("target") ?? 4);
  if (!Number.isInteger(target) || target < 1 || target > 10) throw new Error("Target harus 1-10");
  return {
    tier: parseTier(get("tier") ?? "Ranked"),
    round: text(get("round"), "Round 1"),
    stadium: text(get("stadium"), "Stadium 1"),
    target, aId, bId,
  };
}
