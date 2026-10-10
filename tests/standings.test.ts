import { describe, expect, it } from "vitest";
import { DEFAULT_POINTS_TABLE as T } from "@/lib/content";
import { buildStandings, eventPoints, playerHistory, sizeColumn, weekStart, type ScoredEvent } from "@/domain/standings";

const ev = (id: string, tier: string, startsAt: string, ps: [string, number | null, boolean?][]): ScoredEvent => ({
  id, name: id, tier, startsAt, participants: ps.map(([playerId, place, tk]) => ({ playerId, place, tigerKing: tk ?? false })),
});

describe("points from results", () => {
  it("picks the column from the number of participants", () => {
    expect([39, 40, 49, 50, 69, 70, 90, 120].map((n) => sizeColumn(T.sizes, n))).toEqual([0, 1, 1, 2, 3, 4, 6, 6]);
  });

  it("adds participant, place, top cut (after the first four) and tiger king, times the level", () => {
    expect(eventPoints(T, "Ranked", { place: null, tigerKing: false }, 20)).toBe(0.25);
    expect(eventPoints(T, "Ranked", { place: 1, tigerKing: false }, 20)).toBe(4.25);
    expect(eventPoints(T, "Ranked", { place: 5, tigerKing: false }, 65)).toBe(0.55 + 2.5 + 1);
    expect(eventPoints(T, "Ranked", { place: 2, tigerKing: true }, 20)).toBe(3 + 0.25 + 1);
    expect(eventPoints(T, "Cup", { place: 1, tigerKing: false }, 20)).toBe(8.5);
    expect(eventPoints(T, "Unrank", { place: 1, tigerKing: false }, 20)).toBe(0);
  });
});

describe("standings", () => {
  it("weeks start on Monday in WIB", () => {
    expect(weekStart("2026-10-10T11:00:00Z")).toBe("2026-10-05");
    expect(weekStart("2026-10-11T17:30:00Z")).toBe("2026-10-12"); // Monday 00:30 WIB
  });

  it("totals all events, and compares with the ranking before the latest week", () => {
    const events = [
      ev("1", "Ranked", "2026-10-03T11:00:00Z", [["a", 1], ["b", 2]]),
      ev("2", "Ranked", "2026-10-10T11:00:00Z", [["b", 1], ["a", 2], ["c", null]]),
    ];
    const s = buildStandings(events, T);
    expect(s.get("b")).toMatchObject({ total: 7.5, week: 4.25, rank: 1, previousRank: 2 });
    expect(s.get("a")).toMatchObject({ total: 7.5, week: 3.25, rank: 1 });
    expect(s.get("b")?.tigerKings).toBe(0);
    expect(s.get("c")).toMatchObject({ total: 0.25, week: 0.25, rank: 3, previousRank: null });
  });
});

import { parseResultsText } from "@/domain/result";

describe("results typed as a list", () => {
  const players = ["Mr. DiBo", "Prett", "3R Zero", ...Array.from({ length: 8 }, (_, i) => `P${i}`)].map((name, i) => ({ id: `id-${i}`, name, bom_id: `BoM-${String(i + 1).padStart(3, "0")}` }));

  it("gives places in line order, then participants without a place", () => {
    const rows = parseResultsText("Mr. DiBo\nprett (TK)\nbom 3\n1. P0\nP1\nP2\nP3\nP4\nP5\n\nP6", players);
    expect(rows.map((r) => r.place)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, null, null]);
    expect(rows[1]).toMatchObject({ playerId: "id-1", tigerKing: true });
    expect(rows[2].playerId).toBe("id-2");
  });

  it.each([["", "at least one"], ["Nobody", "not found"], ["Prett\nprett", "twice"], ["Prett (TK)\nMr. DiBo *", "Only one Tiger King"]])("rejects %j", (text, message) => {
    expect(() => parseResultsText(text, players)).toThrow(new RegExp(message, "i"));
  });
});

describe("player history", () => {
  it("lists the player's events oldest first with a running total", () => {
    const events = [
      ev("2", "Ranked", "2026-10-10T11:00:00Z", [["a", 2], ["b", 1]]),
      ev("1", "Ranked", "2026-10-03T11:00:00Z", [["a", 1]]),
      ev("3", "Ranked", "2026-10-17T11:00:00Z", [["b", 1]]),
    ];
    const rows = playerHistory(events, T, "a");
    expect(rows.map((r) => [r.eventId, r.points, r.total, r.participants])).toEqual([["1", 4.25, 4.25, 1], ["2", 3.25, 7.5, 2]]);
  });
});
