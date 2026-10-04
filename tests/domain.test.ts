import { describe, expect, it } from "vitest";
import { parseMatchInput } from "@/domain/match-input";
import { clampScore, outcome, pointsFor } from "@/domain/scoring";
import { parseTier } from "@/domain/tier";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const input = (o: Record<string, unknown>) => parseMatchInput((k) => o[k]);

describe("scoring", () => {
  it("awards 30/10 for Ranked", () => expect(pointsFor("Ranked")).toEqual({ winner: 30, loser: 10 }));
  it.each(["Cup", "Major", "Championship"] as const)("doubles for %s", (t) => expect(pointsFor(t)).toEqual({ winner: 60, loser: 20 }));
  it("clamps scores at zero and truncates", () => {
    expect(clampScore(-3)).toBe(0);
    expect(clampScore(2.9)).toBe(2);
    expect(clampScore(NaN)).toBe(0);
  });
  it("detects outcome", () => {
    expect(outcome(3, 1)).toBe("a");
    expect(outcome(1, 3)).toBe("b");
    expect(outcome(2, 2)).toBe("draw");
  });
});

describe("parseTier", () => {
  it("accepts known tiers", () => expect(parseTier("Cup")).toBe("Cup"));
  it("rejects unknown", () => expect(() => parseTier("Casual")).toThrow());
});

describe("parseMatchInput", () => {
  it("applies defaults", () => {
    expect(input({ a_id: A, b_id: B })).toMatchObject({ tier: "Ranked", round: "Round 1", stadium: "Stadium 1", target: 4 });
  });
  it("rejects same player", () => expect(() => input({ a_id: A, b_id: A })).toThrow());
  it("rejects bad ids", () => expect(() => input({ a_id: "x", b_id: B })).toThrow());
  it("rejects bad target", () => expect(() => input({ a_id: A, b_id: B, target: 11 })).toThrow());
  it("rejects unknown tier", () => expect(() => input({ a_id: A, b_id: B, tier: "Nope" })).toThrow());
  it("rejects overlong text", () => expect(() => input({ a_id: A, b_id: B, round: "x".repeat(41) })).toThrow());
});
