import { describe, expect, it } from "vitest";
import { formatBomId, matchHistory, normalizeBomId, pointsSeries, rankOf, resultFor, winRate } from "@/domain/profile";
import { parsePlacementInput, parseTournamentInput } from "@/domain/tournament";
import type { Match } from "@/domain/types";
import { nextWeekly, upcomingEvents } from "@/domain/next-event";
import { monthKey, monthWeeks, parseMonth, parseWeekday, shiftMonth, weekdayOf } from "@/domain/schedule";
import { parseMatchInput } from "@/domain/match-input";
import { clampScore, outcome, pointsFor, tierMultiplier } from "@/domain/scoring";
import { parseTier, parseTierLabel, usesBomLogo } from "@/domain/tier";
import { eventUsesBomLogo, isoToWibLocal, parseEventInput, pickOnePerDay, wibDay, wibLocalToIso, wibTime } from "@/domain/event";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const input = (o: Record<string, unknown>) => parseMatchInput((k) => o[k]);

describe("scoring", () => {
  it("awards 30/10 for Ranked", () => expect(pointsFor("Ranked")).toEqual({ winner: 30, loser: 10 }));
  it.each([["Cup", 60, 20], ["Major", 90, 30], ["Championship", 120, 40]] as const)("scales %s to %i/%i", (t, winner, loser) => expect(pointsFor(t)).toEqual({ winner, loser }));
  it("multiplies 1x, 2x, 3x, 4x up the ladder", () => {
    expect((["Ranked", "Cup", "Major", "Championship"] as const).map(tierMultiplier)).toEqual([1, 2, 3, 4]);
  });
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
    expect(sub({ name: " DXM ", focus: "", sort_order: "2", is_active: "on" }))
      .toEqual({ name: "DXM", focus: null, sort_order: 2, is_active: true, image_path: null, instagram: null });
  });
  it("requires a name", () => {
    expect(() => sub({ focus: "x" })).toThrow();
  });
  it("rejects bad id and order", () => {
    expect(() => sub({ id: "nope", name: "a" })).toThrow();
    expect(() => sub({ name: "a", sort_order: 1000 })).toThrow();
  });
  it("treats missing checkbox as inactive", () => expect(sub({ name: "a" }).is_active).toBe(false));
});

import { normalizeWhatsapp, parseRegistration } from "@/domain/join-request";
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

describe("parseRegistration", () => {
  const base = { full_name: "  Rakha   Putra ", blader_name: "Rakha", whatsapp: "081234567890", address: " Jl. Contoh No. 1,  Medan ", age_group: "all", accepted_payment: "on", payment_proof: "proofs/0f8fad5b-d9cb-469f-a165-70867728950e.png" };
  const reg = (o: Record<string, unknown> = {}) => parseRegistration((k) => ({ ...base, ...o })[k]);
  it("normalises WhatsApp numbers", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("62 812 3456 7890")).toBe("+6281234567890");
    expect(normalizeWhatsapp("+6281234567890")).toBe("+6281234567890");
    expect(() => normalizeWhatsapp("12345")).toThrow();
  });
  it("parses a registration with the optional field empty", () => {
    expect(reg()).toEqual({
      fullName: "Rakha Putra", bladerName: "Rakha", whatsapp: "+6281234567890", address: "Jl. Contoh No. 1, Medan", ageGroup: "all",
      guardianName: null, guardianWhatsapp: null, hearFrom: null, acceptedPayment: true, photoConsent: false, paymentProofPath: "proofs/0f8fad5b-d9cb-469f-a165-70867728950e.png",
    });
  });
  it("requires a guardian under 12 and ignores one for all ages", () => {
    expect(() => reg({ age_group: "under12" })).toThrow();
    expect(() => reg({ age_group: "under12", guardian_name: "Ibu" })).toThrow();
    expect(reg({ age_group: "under12", guardian_name: "Ibu Rakha", guardian_whatsapp: "08111222333" })).toMatchObject({ guardianName: "Ibu Rakha", guardianWhatsapp: "+628111222333" });
    expect(reg({ guardian_name: "Ibu", guardian_whatsapp: "08111222333" }).guardianName).toBeNull();
  });
  it("requires the payment acknowledgement and records the optional photo consent", () => {
    expect(() => reg({ accepted_payment: undefined })).toThrow();
    expect(() => reg({ accepted_payment: "" })).toThrow();
    expect(reg({ photo_consent: "on" }).photoConsent).toBe(true);
  });
  it("requires a payment screenshot from the proofs folder", () => {
    expect(() => reg({ payment_proof: "" })).toThrow();
    expect(() => reg({ payment_proof: undefined })).toThrow();
    expect(() => reg({ payment_proof: "proofs/../x.png" })).toThrow();
    expect(() => reg({ payment_proof: "sub-communities/0f8fad5b-d9cb-469f-a165-70867728950e.png" })).toThrow();
  });
  it("rejects bad age group, short name, short address and bad number", () => {
    expect(() => reg({ age_group: "13-17" })).toThrow();
    expect(() => reg({ blader_name: "R" })).toThrow();
    expect(() => reg({ address: "Jl" })).toThrow();
    expect(() => reg({ address: "" })).toThrow();
    expect(() => reg({ whatsapp: "123" })).toThrow();
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
  it("upcomingEvents lists weekly Ranked sessions up to the limit", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    const events = upcomingEvents({ now, weekly: { weekday: 6, time: "18:00" }, tournaments: [], limit: 3 });
    expect(events.map((e) => e.at.toISOString())).toEqual(["2026-10-10T11:00:00.000Z", "2026-10-17T11:00:00.000Z", "2026-10-24T11:00:00.000Z"]);
    expect(events[0]).toMatchObject({ title: "Ranked", hasTime: true });
  });
  it("upcomingEvents merges tournaments in date order and trims to the limit", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    const events = upcomingEvents({
      now, weekly: { weekday: 6, time: "18:00" }, limit: 3,
      tournaments: [{ name: "Cup 1", tier: "Cup", held_on: "2026-10-12" }, { name: "Cup 2", tier: "Cup", held_on: "2026-12-01" }],
    });
    expect(events.map((e) => e.title)).toEqual(["Ranked", "Cup: Cup 1", "Ranked"]);
  });
  it("upcomingEvents ignores past tournaments and is empty with nothing scheduled", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    expect(upcomingEvents({ now, weekly: null, tournaments: [{ name: "Old", tier: "Cup", held_on: "2026-09-01" }], limit: 3 })).toEqual([]);
    expect(upcomingEvents({ now, weekly: null, tournaments: [{ name: "Today", tier: "Cup", held_on: "2026-10-08" }], limit: 3 })[0].hasTime).toBe(false);
  });
});

import { parseTeamRoleInput, teamStrip } from "@/domain/team";

describe("team roles", () => {
  const role = (o: Record<string, unknown>, ids: unknown[] = []) => parseTeamRoleInput((k) => o[k], () => ids);
  it("parses a role and dedupes members", () => {
    expect(role({ title: " Finance & Data ", sort_order: "5" }, [A, B, A, "x"])).toEqual({ title: "Finance & Data", sort_order: 5, playerIds: [A, B], photos: {} });
  });
  it("requires a title", () => expect(() => role({ title: " " })).toThrow());
  it("rejects too many members", () => {
    const many = Array.from({ length: 13 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`);
    expect(() => role({ title: "x" }, many)).toThrow();
  });
  it("flattens roles into a labelled strip", () => {
    const strip = teamStrip([{ title: "Chair", sort_order: 1, members: [{ playerId: A, name: "Dewa", bomId: "BoM-001", photo: null }] }]);
    expect(strip).toEqual([{ playerId: A, name: "Dewa", bomId: "BoM-001", photo: null, role: "Chair" }]);
  });
});


describe("parseImagePath founding-team", () => {
  it("accepts hand-named and uuid files", () => {
    expect(parseImagePath("founding-team/dewa.jpg", "founding-team")).toBe("founding-team/dewa.jpg");
    expect(parseImagePath(`founding-team/${A}.png`, "founding-team")).toBe(`founding-team/${A}.png`);
  });
  it("treats empty as no image", () => expect(parseImagePath("", "founding-team")).toBeNull());
  it("rejects traversal, other folders and bad types", () => {
    expect(() => parseImagePath("founding-team/../x.jpg", "founding-team")).toThrow();
    expect(() => parseImagePath("sub-communities/dewa.jpg", "founding-team")).toThrow();
    expect(() => parseImagePath("founding-team/dewa.gif", "founding-team")).toThrow();
  });
  it("keeps sub-community uploads uuid-only", () => expect(() => parseImagePath("sub-communities/dewa.jpg", "sub-communities")).toThrow());
});

import { parseSiteMediaInput } from "@/domain/site-media";
import { mediaExtension } from "@/domain/media";
import { parseYoutubeId } from "@/domain/youtube";

describe("site media", () => {
  const item = (o: Record<string, unknown>) => parseSiteMediaInput((k) => o[k]);
  it("parses an uploaded news video", () => {
    expect(item({ section: "news", path: `news/${A}.mp4`, caption: " Teaser ", sort_order: "1", is_active: "on" }))
      .toEqual({ section: "news", path: `news/${A}.mp4`, youtube_id: null, kind: "video", caption: "Teaser", sort_order: 1, is_active: true });
  });
  it("parses a YouTube link and drops the path", () => {
    expect(item({ section: "news", youtube_url: "https://youtu.be/dQw4w9WgXcQ", is_active: "on" }))
      .toMatchObject({ kind: "youtube", path: null, youtube_id: "dQw4w9WgXcQ" });
  });
  it("parses a gallery photo and treats a missing checkbox as hidden", () => {
    expect(item({ section: "gallery", path: "gallery/gallery-01.jpg" })).toMatchObject({ kind: "image", caption: null, is_active: false });
  });
  it("rejects bad combinations", () => {
    expect(() => item({ section: "gallery", path: `gallery/${A}.mp4` })).toThrow();
    expect(() => item({ section: "news", path: "gallery/gallery-01.jpg" })).toThrow();
    expect(() => item({ section: "news", path: `news/${A}.jpg` })).toThrow();
    expect(() => item({ section: "news", path: `news/${A}.mp4`, youtube_url: "https://youtu.be/dQw4w9WgXcQ" })).toThrow();
    expect(() => item({ section: "news", youtube_url: "https://example.com/x" })).toThrow();
    expect(() => item({ section: "news" })).toThrow();
    expect(() => item({ section: "gallery" })).toThrow();
    expect(() => item({ section: "hero", path: "hero/x.jpg" })).toThrow();
  });
  it("allows video uploads only for news and photos everywhere else", () => {
    expect(mediaExtension("video/mp4", "news")).toBe("mp4");
    expect(() => mediaExtension("image/png", "news")).toThrow();
    expect(() => mediaExtension("video/mp4", "gallery")).toThrow();
    expect(mediaExtension("image/png", "gallery")).toBe("png");
  });
});

describe("parseYoutubeId", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ?t=5", "youtube.com/shorts/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/live/dQw4w9WgXcQ",
  ])("extracts the id from %s", (u) => expect(parseYoutubeId(u)).toBe("dQw4w9WgXcQ"));
  it.each(["", "https://vimeo.com/123", "https://www.youtube.com/watch?v=short", "https://evil.com/watch?v=dQw4w9WgXcQ", "not a url", null])("rejects %s", (u) => expect(parseYoutubeId(u)).toBeNull());
});

describe("team role photos", () => {
  const parse = (entries: [string, unknown][], ids: string[]) => parseTeamRoleInput((k) => ({ title: "T" })[k as "title"], () => ids, entries);
  it("keeps photos only for picked members and clears on empty", () => {
    expect(parse([[`photo:${A}`, "founding-team/dewa.jpg"], [`photo:${B}`, "founding-team/x.jpg"], ["title", "x"]], [A]).photos)
      .toEqual({ [A]: "founding-team/dewa.jpg" });
    expect(parse([[`photo:${A}`, ""]], [A]).photos).toEqual({ [A]: null });
  });
  it("rejects a photo path outside founding-team", () => {
    expect(() => parse([[`photo:${A}`, "gallery/x.jpg"]], [A])).toThrow();
  });
});

import { parseSponsorInput, parseWebsite } from "@/domain/sponsor";

describe("sponsors", () => {
  const sp = (o: Record<string, unknown>) => parseSponsorInput((k) => o[k]);
  const base = { name: " Deli Park ", tier: "silver", logo_path: "sponsors/deli-park.png", sort_order: "1", is_active: "on" };
  it("parses a sponsor", () => {
    expect(sp(base)).toEqual({ name: "Deli Park", tier: "silver", logo_path: "sponsors/deli-park.png", website: null, sort_order: 1, is_active: true });
  });
  it("normalises the website and rejects junk", () => {
    expect(parseWebsite("deli.park/id")).toBe("https://deli.park/id");
    expect(parseWebsite("")).toBeNull();
    expect(() => parseWebsite("javascript:alert(1)")).toThrow();
    expect(() => parseWebsite("not a url")).toThrow();
  });
  it("requires a logo in the sponsors folder and a known tier", () => {
    expect(() => sp({ ...base, logo_path: "" })).toThrow();
    expect(() => sp({ ...base, logo_path: "gallery/x.png" })).toThrow();
    expect(() => sp({ ...base, tier: "platinum" })).toThrow();
  });
});

describe("schedule events", () => {
  const ev = (o: Record<string, unknown>) => parseEventInput((k) => o[k]);
  const base = { name: " Weekly Ranked ", sub_community_id: A, starts_at: "2026-10-10T18:00", place: " Deli Park ", tier: "Ranked", is_active: "on" };
  it("reads the date and time as Medan time", () => {
    expect(wibLocalToIso("2026-10-10T18:00")).toBe("2026-10-10T11:00:00.000Z");
    expect(isoToWibLocal("2026-10-10T11:00:00.000Z")).toBe("2026-10-10T18:00");
    expect(wibDay("2026-10-10T18:30:00.000Z")).toBe("2026-10-11"); // 01:30 WIB the next day
    expect(wibTime("2026-10-10T11:05:00.000Z")).toBe("18:05");
  });
  it("rejects a bad date", () => {
    for (const bad of ["", "2026-13-40T99:00", "tomorrow", null]) expect(() => wibLocalToIso(bad)).toThrow();
  });
  it("parses an event", () => {
    expect(ev(base)).toEqual({ sub_community_id: A, name: "Weekly Ranked", starts_at: "2026-10-10T11:00:00.000Z", place: "Deli Park", tier: "Ranked", is_active: true });
  });
  it("allows an event without a community and the Unrank level", () => {
    expect(ev({ ...base, sub_community_id: "", tier: "Unrank" })).toMatchObject({ sub_community_id: null, tier: "Unrank" });
    expect(parseTierLabel("Championship")).toBe("Championship");
  });
  it("rejects bad community, tier, name and place", () => {
    expect(() => ev({ ...base, sub_community_id: "x" })).toThrow();
    expect(() => ev({ ...base, tier: "Casual" })).toThrow();
    expect(() => ev({ ...base, name: "" })).toThrow();
    expect(() => ev({ ...base, place: "" })).toThrow();
  });
});

describe("event logo", () => {
  it("shows the BOM logo for Cup and above, the sub komunitas logo for Unrank and Ranked", () => {
    expect((["Unrank", "Ranked", "Cup", "Major", "Championship"] as const).map(usesBomLogo)).toEqual([false, false, true, true, true]);
  });
});

describe("one event per day", () => {
  const e = (day: string, tier: "Unrank" | "Ranked" | "Cup" | "Major" | "Championship" | "Break", id: string) => ({ id, tier, starts_at: `${day}T11:00:00.000Z` });
  const sat = ["a", "b", "c", "d", "e"].map((id) => e("2026-10-10", "Ranked", id));
  it("keeps exactly one of several same-day community events", () => {
    expect(pickOnePerDay(sat)).toHaveLength(1);
  });
  it("is stable for a given day, so the calendar does not flicker", () => {
    expect(pickOnePerDay(sat)[0].id).toBe(pickOnePerDay([...sat].reverse())[0].id);
  });
  it("varies across days instead of always taking the first", () => {
    const picks = new Set(Array.from({ length: 28 }, (_, i) => pickOnePerDay(["a", "b", "c", "d", "e"].map((id) => e(`2026-11-${String(i + 1).padStart(2, "0")}`, "Ranked", id)))[0].id));
    expect(picks.size).toBeGreaterThan(1);
  });
  it("lets a break, then the bigger competition, win the day", () => {
    expect(pickOnePerDay([...sat, e("2026-10-10", "Cup", "cup")]).map((x) => x.id)).toEqual(["cup"]);
    expect(pickOnePerDay([...sat, e("2026-10-10", "Cup", "cup"), e("2026-10-10", "Break", "off")]).map((x) => x.id)).toEqual(["off"]);
  });
  it("keeps one event for each different day, in the given order", () => {
    const list = [e("2026-10-10", "Ranked", "x"), e("2026-10-11", "Unrank", "y")];
    expect(pickOnePerDay(list).map((x) => x.id)).toEqual(["x", "y"]);
  });
  it("accepts Break as an event type and shows the BOM logo for it", () => {
    expect(parseEventInput((k) => ({ name: "Libur", starts_at: "2026-12-25T10:00", place: "-", tier: "Break" })[k as "name"])).toMatchObject({ tier: "Break" });
    expect(eventUsesBomLogo("Break")).toBe(true);
    expect(eventUsesBomLogo("Ranked")).toBe(false);
  });
});

import { rankedDays } from "@/domain/event";

describe("rankedDays", () => {
  const at = (day: string, tier: "Ranked" | "Cup" | "Unrank") => ({ starts_at: `${day}T11:00:00.000Z`, tier });
  it("counts the different days with a Ranked event, not the events", () => {
    expect(rankedDays([at("2026-10-10", "Ranked"), at("2026-10-10", "Ranked"), at("2026-10-15", "Ranked"), at("2026-10-12", "Unrank"), at("2026-10-14", "Cup")])).toBe(2);
    expect(rankedDays([])).toBe(0);
  });
});

import { parsePlayerInput } from "@/domain/player-input";
import { ranks, searchPlayers, sortPlayers } from "@/domain/leaderboard";

describe("leaderboard search and sort", () => {
  const rows = [
    { bom_id: "BoM-012", name: "Sora", points: 50 },
    { bom_id: "BoM-001", name: "Dewa", points: 90 },
    { bom_id: "BoM-100", name: "alpha", points: 90 },
    { bom_id: "BoM-007", name: "Zenn X", points: 10 },
  ];
  it("finds by blader name or BOM ID, however the ID is typed", () => {
    expect(searchPlayers(rows, "sor").map((p) => p.name)).toEqual(["Sora"]);
    expect(searchPlayers(rows, "bom-012").map((p) => p.name)).toEqual(["Sora"]);
    expect(searchPlayers(rows, "bom 7").map((p) => p.name)).toEqual(["Zenn X"]);
    expect(searchPlayers(rows, "  ")).toHaveLength(4);
    expect(searchPlayers(rows, "nobody")).toEqual([]);
  });
  it("sorts by points (highest first, ties by name), by name, and by BOM ID number", () => {
    expect(sortPlayers(rows, "points", "desc").map((p) => p.name)).toEqual(["alpha", "Dewa", "Sora", "Zenn X"]);
    expect(sortPlayers(rows, "name", "asc").map((p) => p.name)).toEqual(["alpha", "Dewa", "Sora", "Zenn X"]);
    expect(sortPlayers(rows, "name", "desc").map((p) => p.name)).toEqual(["Zenn X", "Sora", "Dewa", "alpha"]);
    expect(sortPlayers(rows, "bom_id", "asc").map((p) => p.bom_id)).toEqual(["BoM-001", "BoM-007", "BoM-012", "BoM-100"]);
  });
  it("numbers players by position in the default order, so equal points still get 1, 2, 3", () => {
    expect([...ranks(rows)].sort((a, b) => a[1] - b[1])).toEqual([["BoM-100", 1], ["BoM-001", 2], ["BoM-012", 3], ["BoM-007", 4]]);
  });
});

describe("parsePlayerInput", () => {
  const ok = { id: A, bom_id: "BoM-012", name: " Sora ", points: "50", wins: "3", losses: "1", status: "active" };
  const player = (o: Record<string, unknown>) => parsePlayerInput((k) => o[k]);
  it("parses an edit", () => expect(player(ok)).toEqual({ id: A, bom_id: "BoM-012", name: "Sora", points: 50, wins: 3, losses: 1, status: "active" }));
  it("rejects bad ids, numbers and status", () => {
    expect(() => player({ ...ok, id: "x" })).toThrow();
    expect(() => player({ ...ok, bom_id: "BoM 12!" })).toThrow();
    expect(() => player({ ...ok, points: "-1" })).toThrow();
    expect(() => player({ ...ok, wins: "1.5" })).toThrow();
    expect(() => player({ ...ok, status: "banned" })).toThrow();
    expect(() => player({ ...ok, name: "" })).toThrow();
  });
});

import { POINTS_BY_CATEGORY, POINTS_BY_RANK, POINTS_SIZES } from "@/lib/content";

describe("points table", () => {
  it("has a value for every participant size in every row", () => {
    for (const r of [...POINTS_BY_RANK, ...POINTS_BY_CATEGORY]) expect(r.values).toHaveLength(POINTS_SIZES.length);
  });
  it("pays more for a better place and for a bigger field", () => {
    for (let c = 0; c < POINTS_SIZES.length; c++) for (let r = 1; r < POINTS_BY_RANK.length; r++) expect(POINTS_BY_RANK[r - 1].values[c]).toBeGreaterThanOrEqual(POINTS_BY_RANK[r].values[c]);
    for (const r of POINTS_BY_RANK) for (let c = 1; c < r.values.length; c++) expect(r.values[c]).toBeGreaterThanOrEqual(r.values[c - 1]);
  });
});
