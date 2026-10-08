import { describe, expect, it } from "vitest";
import { formatBomId, matchHistory, normalizeBomId, pointsSeries, rankOf, resultFor, winRate } from "@/domain/profile";
import { parsePlacementInput, parseTournamentInput } from "@/domain/tournament";
import type { Match } from "@/domain/types";
import { nextWeekly, pickNextEvent } from "@/domain/next-event";
import { monthKey, monthWeeks, parseMonth, parseWeekday, shiftMonth, weekdayOf } from "@/domain/schedule";
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

import { parseSubCommunityInput } from "@/domain/sub-community";

describe("parseSubCommunityInput", () => {
  const sub = (o: Record<string, unknown>) => parseSubCommunityInput((k) => o[k]);
  it("parses a valid row", () => {
    expect(sub({ name: " DXM ", schedule: "Sabtu malam", focus: "", sort_order: "2", is_active: "on" }))
      .toEqual({ name: "DXM", schedule: "Sabtu malam", focus: null, sort_order: 2, is_active: true, image_path: null, instagram: null });
  });
  it("requires name and schedule", () => {
    expect(() => sub({ schedule: "x" })).toThrow();
    expect(() => sub({ name: "x" })).toThrow();
  });
  it("rejects bad id and order", () => {
    expect(() => sub({ id: "nope", name: "a", schedule: "b" })).toThrow();
    expect(() => sub({ name: "a", schedule: "b", sort_order: 1000 })).toThrow();
  });
  it("treats missing checkbox as inactive", () => expect(sub({ name: "a", schedule: "b" }).is_active).toBe(false));
});

import { normalizeWhatsapp, parseJoinRequest } from "@/domain/join-request";
import { imageExtension, parseImagePath } from "@/domain/media";

describe("media", () => {
  const path = "sub-communities/0f8fad5b-d9cb-469f-a165-70867728950e.webp";
  it("accepts an uploaded path or empty", () => {
    expect(parseImagePath(path, "sub-communities")).toBe(path);
    expect(parseImagePath("", "sub-communities")).toBeNull();
  });
  it("rejects foreign or traversal paths", () => {
    expect(() => parseImagePath("players/0f8fad5b-d9cb-469f-a165-70867728950e.webp", "sub-communities")).toThrow();
    expect(() => parseImagePath("sub-communities/../x.webp", "sub-communities")).toThrow();
  });
  it("maps image types", () => {
    expect(imageExtension("image/jpeg")).toBe("jpg");
    expect(() => imageExtension("image/gif")).toThrow();
  });
});

describe("parseJoinRequest", () => {
  const join = (o: Record<string, unknown>) => parseJoinRequest((k) => o[k]);
  it("normalises WhatsApp numbers", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("62 812 3456 7890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("+6281234567890")).toBe("+6281234567890");
    expect(() => normalizeWhatsapp("12345")).toThrow();
  });
  it("parses a valid request", () => {
    expect(join({ name: "  Rakha   Putra ", email: "Rakha@Mail.com", whatsapp: "081234567890", sub_community: "" }))
      .toEqual({ name: "Rakha Putra", email: "rakha@mail.com", whatsapp: "+6281234567890", sub_community: null });
  });
  it("rejects bad email and short name", () => {
    expect(() => join({ name: "Rakha", email: "nope", whatsapp: "081234567890" })).toThrow();
    expect(() => join({ name: "R", email: "a@b.co", whatsapp: "081234567890" })).toThrow();
  });
});

import { parseInstagram } from "@/domain/validation";

describe("parseInstagram", () => {
  it("accepts handles and profile URLs", () => {
    expect(parseInstagram("@turcil.mdn")).toBe("turcil.mdn");
    expect(parseInstagram("https://www.instagram.com/turcil.mdn/?hl=id")).toBe("turcil.mdn");
    expect(parseInstagram("")).toBeNull();
  });
  it("rejects invalid handles", () => expect(() => parseInstagram("bad handle!")).toThrow());
});

describe("member profile", () => {
  const P = "11111111-1111-1111-1111-111111111111";
  const Q = "22222222-2222-2222-2222-222222222222";
  const m = (o: Partial<Match>): Match => ({
    id: "m", tier: "Ranked", round: "R1", stadium: "S1", target: 4, a_id: P, b_id: Q,
    a_name: "A", b_name: "B", a_score: 4, b_score: 2, status: "finished", updated_at: "2026-01-01T00:00:00Z", ...o,
  });

  it.each([["bom-001", "bom-001"], [" BoM-001 ", "BoM-001"], ["a_b", null], ["", null], ["x".repeat(21), null], ["a%b", null]])("normalizeBomId(%j)", (raw, want) => {
    expect(normalizeBomId(raw)).toBe(want);
  });

  it("resultFor works from either side", () => {
    expect(resultFor(m({}), P)).toBe("win");
    expect(resultFor(m({}), Q)).toBe("loss");
    expect(resultFor(m({ a_score: 3, b_score: 3 }), P)).toBe("draw");
  });

  it("matchHistory flips perspective and sorts newest first", () => {
    const rows = matchHistory([
      m({ id: "old", updated_at: "2026-01-01T00:00:00Z" }),
      m({ id: "new", a_id: Q, b_id: P, a_name: "B", b_name: "A", a_score: 1, b_score: 4, a_combo: "x", b_combo: "y", updated_at: "2026-02-01T00:00:00Z" }),
      m({ id: "live", status: "live" }),
    ], P);
    expect(rows.map((r) => r.id)).toEqual(["new", "old"]);
    expect(rows[0]).toMatchObject({ opponent: "B", score: 4, opponentScore: 1, result: "win", combo: "y", opponentCombo: "x" });
  });

  it("pointsSeries replays finish_match, skipping draws and unknown opponents", () => {
    const series = pointsSeries([
      m({ id: "1", updated_at: "2026-01-01T00:00:00Z" }),
      m({ id: "2", tier: "Cup", a_score: 1, b_score: 4, updated_at: "2026-01-02T00:00:00Z" }),
      m({ id: "3", a_score: 2, b_score: 2, updated_at: "2026-01-03T00:00:00Z" }),
      m({ id: "4", b_id: null, updated_at: "2026-01-04T00:00:00Z" }),
    ], P);
    expect(series.map((s) => s.points)).toEqual([30, 50]);
  });

  it("formatBomId brackets and upper-cases", () => {
    expect(formatBomId("BoM-001")).toBe("[BOM-001]");
    expect(formatBomId("bom-777")).toBe("[BOM-777]");
  });

  it("winRate and rankOf", () => {
    expect(winRate(0, 0)).toBe(0);
    expect(winRate(3, 1)).toBe(75);
    expect(rankOf(100, [300, 100, 100, 50])).toBe(2);
  });
});

describe("tournament input", () => {
  const U = "11111111-1111-1111-1111-111111111111";
  const T = (o: Record<string, unknown>) => parseTournamentInput((k) => o[k]);
  it("parses a tournament", () => {
    expect(T({ name: " Cup 1 ", tier: "Cup", held_on: "2026-03-01" })).toEqual({ name: "Cup 1", tier: "Cup", held_on: "2026-03-01" });
  });
  it.each([{ name: "", tier: "Cup", held_on: "2026-03-01" }, { name: "x", tier: "Nope", held_on: "2026-03-01" }, { name: "x", tier: "Cup", held_on: "03/01/2026" }])("rejects %j", (o) => {
    expect(() => T(o)).toThrow();
  });
  it("parses placements", () => {
    expect(parsePlacementInput((k) => ({ tournament_id: U, player_id: U, place: "2" })[k as "place"])).toEqual({ tournamentId: U, playerId: U, place: 2 });
    expect(() => parsePlacementInput((k) => ({ tournament_id: U, player_id: U, place: "0" })[k as "place"])).toThrow();
  });
});

describe("schedule", () => {
  it.each([["Sabtu malam", 6], ["Kamis malam", 4], ["tiap JUM'AT", 5], ["Setiap hari", null]])("parseWeekday(%j)", (text, want) => {
    expect(parseWeekday(text)).toBe(want);
  });

  it("parseMonth falls back on bad input", () => {
    const fb = { year: 2026, month: 10 };
    expect(parseMonth("2026-03", fb)).toEqual({ year: 2026, month: 3 });
    for (const bad of [undefined, "", "2026-13", "2026-00", "x", "1999-01"]) expect(parseMonth(bad, fb)).toBe(fb);
  });

  it("shiftMonth crosses years", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(monthKey({ year: 2026, month: 3 })).toBe("2026-03");
  });

  it("monthWeeks pads Monday-first weeks", () => {
    const weeks = monthWeeks({ year: 2026, month: 10 }); // 1 Oct 2026 is a Thursday
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(weeks.flat().filter((d) => d !== null)).toHaveLength(31);
    expect(weekdayOf({ year: 2026, month: 10 }, 3)).toBe(6);
  });
});

describe("next event", () => {
  // Saturday 10 Oct 2026, 18:00 WIB = 11:00 UTC.
  const SAT_6PM = "2026-10-10T11:00:00.000Z";
  it("nextWeekly picks this Saturday before 18:00 WIB and the next one after", () => {
    expect(nextWeekly(new Date("2026-10-08T05:00:00Z"), 6, "18:00").toISOString()).toBe(SAT_6PM);
    expect(nextWeekly(new Date("2026-10-10T10:59:00Z"), 6, "18:00").toISOString()).toBe(SAT_6PM);
    expect(nextWeekly(new Date(SAT_6PM), 6, "18:00").toISOString()).toBe("2026-10-17T11:00:00.000Z");
  });
  it("nextWeekly uses the WIB calendar day, not UTC", () => {
    // Sat 10 Oct 01:00 WIB is still Friday 18:00 UTC.
    expect(nextWeekly(new Date("2026-10-09T18:00:00Z"), 6, "18:00").toISOString()).toBe(SAT_6PM);
  });
  it("pickNextEvent prefers the sooner of weekly Ranked and a tournament", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    const weekly = { weekday: 6, time: "18:00" };
    expect(pickNextEvent({ now, weekly, tournament: null })?.title).toBe("Next Ranked");
    expect(pickNextEvent({ now, weekly, tournament: { name: "Cup 1", tier: "Cup", held_on: "2026-10-09" } })?.title).toBe("Next Cup: Cup 1");
    expect(pickNextEvent({ now, weekly, tournament: { name: "Cup 2", tier: "Cup", held_on: "2026-11-01" } })?.title).toBe("Next Ranked");
  });
  it("pickNextEvent ignores past tournaments and returns null when empty", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    expect(pickNextEvent({ now, weekly: null, tournament: { name: "Old", tier: "Cup", held_on: "2026-09-01" } })).toBeNull();
    expect(pickNextEvent({ now, weekly: null, tournament: { name: "Today", tier: "Cup", held_on: "2026-10-08" } })?.hasTime).toBe(false);
  });
});
