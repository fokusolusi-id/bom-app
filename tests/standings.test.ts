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
    expect(eventPoints(T, "Cup", { place: 1, tigerKing: false }, 20)).toBe(4.25);
    expect(eventPoints(T, "Major", { place: 1, tigerKing: false }, 20)).toBe(6.38);
    expect(eventPoints(T, "Championship", { place: 1, tigerKing: false }, 20)).toBe(8.5);
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

import { parseCombos, parseResultsText } from "@/domain/result";

describe("results typed as a list", () => {
  const players = ["Mr. DiBo", "Prett", "3R Zero", ...Array.from({ length: 8 }, (_, i) => `P${i}`)].map((name, i) => ({ id: `id-${i}`, name, bom_id: `BoM-${String(i + 1).padStart(3, "0")}` }));

  it("gives places in line order, then participants without a place", () => {
    const rows = parseResultsText("Mr. DiBo\nprett (TK)\nbom 3\n4. P0\nP1\nP2\nP3\nP4\nP5\n\nP6", players);
    expect(rows.map((r) => r.place)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, null, null]);
    expect(rows.every((r) => r.guestName === null)).toBe(true);
    expect(rows[1]).toMatchObject({ playerId: "id-1", tigerKing: true });
    expect(rows[2].playerId).toBe("id-2");
  });

  it.each([["", "at least one"], ["Prett\nprett", "twice"], ["Prett (TK)\nMr. DiBo *", "Only one Tiger King"], ["Nobody (TK)", "no BOM ID"]])("rejects %j", (text, message) => {
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

import { parsePlayerInput } from "@/domain/player-input";

describe("player edit", () => {
  const U = "11111111-1111-1111-1111-111111111111";
  const form = (o: Record<string, string>) => (k: string) => o[k] ?? "";
  const base = { id: U, name: "Dewa", bom_id: "BoM-001", status: "active", role: "organizer" };

  it("allows every membership detail to be empty", () => {
    expect(parsePlayerInput(form(base))).toMatchObject({ id: U, name: "Dewa", role: "organizer", full_name: null, whatsapp: null, address: null, age_group: null, photo_consent: false });
  });

  it("reads and normalises the membership details", () => {
    expect(parsePlayerInput(form({ ...base, full_name: "Dewa  Wahyu", whatsapp: "0812 3456 7890", age_group: "all", photo_consent: "on" })))
      .toMatchObject({ full_name: "Dewa Wahyu", whatsapp: "+6281234567890", guardian_name: null, photo_consent: true });
  });

  it("needs a guardian under 12, and rejects an unknown role", () => {
    expect(() => parsePlayerInput(form({ ...base, age_group: "under12" }))).toThrow();
    expect(() => parsePlayerInput(form({ ...base, role: "boss" }))).toThrow(/role/i);
  });
});

import { challongeResultsText, entriesFromChallonge, parseChallongeUrl } from "@/domain/challonge";

describe("Challonge", () => {
  it("reads bracket links", () => {
    expect(parseChallongeUrl("https://challonge.com/dxm_nouxbeytle_topcut")).toEqual({ url: "https://challonge.com/dxm_nouxbeytle_topcut", apiId: "dxm_nouxbeytle_topcut" });
    expect(parseChallongeUrl("challonge.com/abc/standings")).toMatchObject({ apiId: "abc" });
    expect(parseChallongeUrl("https://dxm.challonge.com/cup1")).toEqual({ url: "https://dxm.challonge.com/cup1", apiId: "dxm-cup1" });
    expect(parseChallongeUrl("  ")).toBeNull();
    expect(() => parseChallongeUrl("https://example.com/abc")).toThrow(/challonge/i);
  });

  const json = (ranks: (number | null)[]) => ({ tournament: { participants: ranks.map((r, i) => ({ participant: { name: `P${i}`, final_rank: r } })) } });

  it("orders the participants by final rank and needs a finished bracket", () => {
    expect(entriesFromChallonge(json([3, 1, 2, 3])).map((e) => e.name)).toEqual(["P1", "P2", "P0", "P3"]);
    expect(() => entriesFromChallonge(json([null, null]))).toThrow(/final ranking/i);
    expect(() => entriesFromChallonge({})).toThrow();
  });

  it("writes the results list with real places, and reports names it cannot match", () => {
    const members = [{ name: "Mr. DiBo", bom_id: "BoM-002" }, { name: "Dewa", bom_id: "BoM-001" }];
    const entries = [{ name: "mr. dibo", rank: 1 }, { name: "Someone [BOM-001]", rank: 2 }, { name: "Stranger", rank: 3 }, { name: "Late", rank: 9 }];
    expect(challongeResultsText(entries, members)).toEqual({ text: "1. Mr. DiBo\n2. Dewa\n3. Stranger\nLate", unmatched: ["Stranger", "Late"] });
  });

  it("lets two members share a place", () => {
    const players = [{ id: "a", name: "A", bom_id: "BoM-001" }, { id: "b", name: "B", bom_id: "BoM-002" }, { id: "c", name: "C", bom_id: "BoM-003" }];
    expect(parseResultsText("1. A\n3. B\n3. C", players).map((r) => r.place)).toEqual([1, 3, 3]);
  });
});

describe("guests without a BOM ID", () => {
  const players = [{ id: "a", name: "A", bom_id: "BoM-001" }, { id: "b", name: "B", bom_id: "BoM-002" }];

  it("saves a name that matches nobody as a guest, keeping its place", () => {
    expect(parseResultsText("1. Stranger\n2. A\n3. B", players)).toEqual([
      { playerId: null, guestName: "Stranger", place: 1, tigerKing: false, combos: [] },
      { playerId: "a", guestName: null, place: 2, tigerKing: false, combos: [] },
      { playerId: "b", guestName: null, place: 3, tigerKing: false, combos: [] },
    ]);
  });

  it("counts guests as participants but gives them no standing", () => {
    const events = [ev("1", "Ranked", "2026-10-03T11:00:00Z", [["a", 2]])];
    events[0].participants.push({ playerId: null, place: 1, tigerKing: false });
    const s = buildStandings(events, T);
    expect([...s.keys()]).toEqual(["a"]);
    expect(s.get("a")?.total).toBe(3.25);
  });
});

describe("results with winning combos", () => {
  const players = [
    { id: "decade", name: "Decade", bom_id: "BoM-123" },
    { id: "dibo", name: "Mr. DiBo", bom_id: "BoM-002" },
    ...Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, bom_id: `BoM-${500 + i}` })),
  ];
  const sample = [
    "1 [BOM-123] Decade (TK)", "AP 1-80 LR", "HR 9-60 LO", "PW 3-60 R", "",
    "2 [BOM-XXX]   Mr. DiBo", "DSt 6-70 J", "CDg 3-60 E", "TB 1-60 R", "",
    "3 [Non BOM ID] Vampire", "AP 1-50 R", "PW 3-60 LR",
    "4 [BOM-XXX] Corona Vaires", "SSC 4-50 J",
  ].join("\n");

  it("reads a numbered list: place, BOM ID, name, then up to three combos", () => {
    const rows = parseResultsText(sample, players);
    expect(rows[0]).toEqual({ playerId: "decade", guestName: null, place: 1, tigerKing: true, combos: ["AP 1-80 LR", "HR 9-60 LO", "PW 3-60 R"] });
    expect(rows[1]).toMatchObject({ playerId: "dibo", place: 2, combos: ["DSt 6-70 J", "CDg 3-60 E", "TB 1-60 R"] });
    expect(rows[2]).toEqual({ playerId: null, guestName: "Vampire", place: 3, tigerKing: false, combos: ["AP 1-50 R", "PW 3-60 LR"] });
    expect(rows[3]).toMatchObject({ playerId: null, guestName: "Corona Vaires", place: 4 });
  });

  it("makes a guest of a member's name when marked Non BOM ID", () => {
    expect(parseResultsText("1 [Non BOM ID] Decade", players)[0]).toMatchObject({ playerId: null, guestName: "Decade" });
  });

  it("allows combos only for the top 8, and at most three", () => {
    const top8 = Array.from({ length: 8 }, (_, i) => `${i + 1} [BOM-${500 + i}] P${i}`).join("\n");
    // Combos under a place after 8th are not combos: the line is read as the next member.
    expect(parseResultsText(`${top8}\n9 [BOM-002] Mr. DiBo\nAP 1-80 LR`, players).at(-1)).toMatchObject({ place: null, combos: [] });
    expect(() => parseResultsText("9 Late\n1 P0\nAP 1-80 LR", players)).not.toThrow();
    expect(() => parseCombos("AP 1-80 LR", 9)).toThrow(/top 8/i);
    expect(parseCombos("AP 1-80 LR", 8)).toEqual(["AP 1-80 LR"]);
    // A fourth line under a member is the next member (2nd place here), not a fourth combo.
    expect(parseResultsText("1 Decade\na\nb\nc\nMr. DiBo", players).map((r) => [r.guestName ?? r.playerId, r.place, r.combos.length])).toEqual([["decade", 1, 3], ["dibo", 2, 0]]);
  });

  it("reads plain lines after a blank line as the next members: just a BOM ID or a name", () => {
    const text = "1 [BOM-123] Decade (TK)\nAP 1-80 LR\n\nMr. DiBo\nbom 500\nStranger";
    // Past 8th they have no place at all.
    const late = "8 [BOM-500] P0\nAP 1-80 LR\n\nMr. DiBo\nStranger";
    expect(parseResultsText(late, players).map((r) => [r.place, r.combos.length])).toEqual([[8, 1], [null, 0], [null, 0]]);
    const rows = parseResultsText(text, players);
    expect(rows.map((r) => [r.playerId ?? r.guestName, r.place, r.combos.length])).toEqual([["decade", 1, 1], ["dibo", 2, 0], ["p0", 3, 0], ["Stranger", 4, 0]]);
  });

  it("still reads a plain list of names", () => {
    expect(parseResultsText("Decade\nMr. DiBo", players).map((r) => [r.playerId, r.place, r.combos])).toEqual([["decade", 1, []], ["dibo", 2, []]]);
  });
});

import { formatResultsText } from "@/domain/result";

describe("writing detected results back as text", () => {
  it("fills in the real BOM IDs and marks guests", () => {
    const players = [{ id: "a", name: "Decade", bom_id: "BoM-123" }];
    const rows = parseResultsText("1 [BOM-XXX] decade (TK)\nAP 1-80 LR\n\n2 Vampire", players);
    expect(formatResultsText(rows, players)).toBe("1 [BOM-123] Decade (TK)\nAP 1-80 LR\n\n2 [Non BOM ID] Vampire");
  });
});

describe("name and BOM ID together", () => {
  const players = [{ id: "dibo", name: "Mr. DiBo", bom_id: "BoM-002" }, { id: "prett", name: "Prett", bom_id: "BoM-013" }, { id: "x", name: "XtaegunS", bom_id: "BoM-010" }];

  it("finds a member by name ignoring case, spaces, punctuation and a BoM prefix", () => {
    expect(parseResultsText("1 [BOM-XXX] MR.Dibo", players)[0].playerId).toBe("dibo");
    expect(parseResultsText("1 BoM Mr.Dibo\n2 BoM XtaegunS", players).map((r) => r.playerId)).toEqual(["dibo", "x"]);
  });

  it("checks the BOM ID first, and flags a name that does not fit it", () => {
    const [row] = parseResultsText("1 [BOM-002] Prett", players);
    expect(row.playerId).toBe("dibo");
    expect(row.warning).toMatch(/Mr\. DiBo/);
    expect(parseResultsText("1 [BOM-002] MR.Dibo", players)[0].warning).toBeUndefined();
    expect(parseResultsText("1 [BOM-002]", players)[0]).toMatchObject({ playerId: "dibo" });
  });

  it("falls back to the name when the BOM ID is a placeholder or unknown", () => {
    expect(parseResultsText("1 [BOM-999] Prett", players)[0].playerId).toBe("prett");
  });
});

import { comboStats, parseCombo } from "@/domain/combos";

describe("winning combo statistics", () => {
  it("splits a combo into blade, ratchet and bit", () => {
    expect(parseCombo("AP 1-80 LR")).toEqual({ blade: "AP", ratchet: "1-80", bit: "LR" });
    expect(parseCombo("EW GH 1-60 LR")).toEqual({ blade: "EW GH", ratchet: "1-60", bit: "LR" });
    expect(parseCombo("S.Cal 1-70 T")).toEqual({ blade: "S.Cal", ratchet: "1-70", bit: "T" });
    expect(parseCombo("VB K")).toEqual({ blade: "VB K", ratchet: null, bit: null });
  });

  it("finds what a member wins with most, ignoring case, and prefers the latest on a tie", () => {
    const stats = comboStats(["PW 3-60 R", "AP 1-80 LR", "pw 3-60 LR", "HR 9-60 LO", "AP 1-80 LR"]);
    expect(stats.combo).toEqual({ name: "AP 1-80 LR", count: 2 });
    expect(stats.blade).toEqual({ name: "PW", count: 2 });
    expect(stats.ratchet).toMatchObject({ count: 2 });
    expect(stats.bit).toEqual({ name: "LR", count: 3 });
    expect(comboStats([])).toEqual({ combo: null, blade: null, ratchet: null, bit: null });
  });
});

import { pageNumbers } from "@/components/ui/pagination";

describe("page numbers", () => {
  it("shows every page when there are few", () => {
    expect(pageNumbers(1, 0)).toEqual([0]);
    expect(pageNumbers(9, 4)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("keeps the ends and the pages around the current one when there are many", () => {
    expect(pageNumbers(20, 0)).toEqual([0, 1, null, 18, 19]);
    expect(pageNumbers(20, 10)).toEqual([0, 1, null, 9, 10, 11, null, 18, 19]);
    expect(pageNumbers(20, 19)).toEqual([0, 1, null, 18, 19]);
  });
});
