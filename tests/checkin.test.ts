import { describe, expect, it } from "vitest";
import { parseCheckinCombos, parseCheckinInput, parseScannedBomId, withCheckinCombos } from "@/domain/checkin";
import type { ResultRow } from "@/domain/result";

const EVENT = "11111111-1111-1111-1111-111111111111";
const PLAYER = "22222222-2222-2222-2222-222222222222";

describe("parseScannedBomId", () => {
  it("reads the BOM ID from the member page address in the card's QR code", () => {
    expect(parseScannedBomId("https://bom.example.com/member/bom-001")).toBe("bom-001");
    expect(parseScannedBomId("https://bom.example.com/member/BoM-012?x=1")).toBe("bom-012");
  });
  it("accepts a bare BOM ID and rejects anything else", () => {
    expect(parseScannedBomId(" BoM-007 ")).toBe("bom-007");
    expect(parseScannedBomId("https://example.com/other")).toBeNull();
    expect(parseScannedBomId("hello")).toBeNull();
  });
});

describe("parseCheckinCombos", () => {
  it("keeps up to three combos, tidied", () => {
    expect(parseCheckinCombos(["AP  1-80 LR", "", " HR 9-60 LO "])).toEqual(["AP 1-80 LR", "HR 9-60 LO"]);
    expect(parseCheckinCombos("A 1-60 R\nB 1-60 R")).toEqual(["A 1-60 R", "B 1-60 R"]);
  });
  it("rejects more than three, or a very long one", () => {
    expect(() => parseCheckinCombos(["a", "b", "c", "d"])).toThrow(/At most 3/);
    expect(() => parseCheckinCombos(["x".repeat(41)])).toThrow(/40/);
  });
});

describe("parseCheckinInput", () => {
  it("takes a member", () => {
    const data: Record<string, unknown> = { event_id: EVENT, player_id: PLAYER, combos: ["AP 1-80 LR"] };
    expect(parseCheckinInput((k) => data[k])).toEqual({ eventId: EVENT, playerId: PLAYER, guestName: null, combos: ["AP 1-80 LR"] });
  });
  it("takes a guest by name, and needs one", () => {
    const guest: Record<string, unknown> = { event_id: EVENT, player_id: "", guest_name: "  Vampire  ", combos: [] };
    expect(parseCheckinInput((k) => guest[k])).toEqual({ eventId: EVENT, playerId: null, guestName: "Vampire", combos: [] });
    const none: Record<string, unknown> = { event_id: EVENT, player_id: "", guest_name: "" };
    expect(() => parseCheckinInput((k) => none[k])).toThrow(/Name is required/);
  });
});

describe("withCheckinCombos", () => {
  const row = (over: Partial<ResultRow>): ResultRow => ({ playerId: null, guestName: null, place: null, tigerKing: false, combos: [], ...over });
  it("gives the top 8 the combos from check-in instead of the typed ones", () => {
    const rows = [row({ playerId: PLAYER, place: 1, combos: ["typed 1-60 R"] }), row({ guestName: "Vampire", place: 2 })];
    const out = withCheckinCombos(rows, [{ playerId: PLAYER, guestName: null, combos: ["AP 1-80 LR"] }, { playerId: null, guestName: "vampire", combos: ["X 3-60 F"] }]);
    expect(out.map((r) => r.combos)).toEqual([["AP 1-80 LR"], ["X 3-60 F"]]);
  });
  it("leaves 9th and below, and anyone without check-in combos, alone", () => {
    const rows = [row({ playerId: PLAYER, place: 9 }), row({ playerId: "x", place: 3, combos: ["typed 1-60 R"] })];
    const out = withCheckinCombos(rows, [{ playerId: PLAYER, guestName: null, combos: ["AP 1-80 LR"] }, { playerId: "x", guestName: null, combos: [] }]);
    expect(out.map((r) => r.combos)).toEqual([[], ["typed 1-60 R"]]);
  });
});
