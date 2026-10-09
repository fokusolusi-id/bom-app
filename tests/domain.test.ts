import { describe, expect, it } from "vitest";
import { formatBomId, normalizeBomId, rankOf } from "@/domain/profile";
import { parsePlacementInput } from "@/domain/result";
import { nextWeekly, upcomingEvents } from "@/domain/next-event";
import { monthKey, monthWeeks, parseMonth, parseWeekday, shiftMonth, weekdayOf } from "@/domain/schedule";
import { tierMultiplier } from "@/domain/scoring";
import { parseTier, parseTierLabel, usesBomLogo } from "@/domain/tier";
import { eventUsesBomLogo, isoToWibLocal, parseEventInput, pickOnePerDay, wibDay, wibLocalToIso, wibTime } from "@/domain/event";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

describe("scoring", () => {
  it("multiplies 1x, 2x, 3x, 4x up the ladder", () => {
    expect((["Ranked", "Cup", "Major", "Championship"] as const).map(tierMultiplier)).toEqual([1, 2, 3, 4]);
  });
});

describe("parseTier", () => {
  it("accepts known tiers", () => expect(parseTier("Cup")).toBe("Cup"));
  it("rejects unknown", () => expect(() => parseTier("Casual")).toThrow());
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
  it.each([["bom-001", "bom-001"], [" BoM-001 ", "BoM-001"], ["a_b", null], ["", null], ["x".repeat(21), null], ["a%b", null]])("normalizeBomId(%j)", (raw, want) => {
    expect(normalizeBomId(raw)).toBe(want);
  });
  it("formatBomId shows the id in brackets, upper-case", () => expect(formatBomId("BoM-001")).toBe("[BOM-001]"));
  it("rankOf shares the better rank on ties", () => {
    expect(rankOf(100, [300, 100, 100, 50])).toBe(2);
  });
});

describe("placement input", () => {
  const U = "11111111-1111-1111-1111-111111111111";
  it("parses placements", () => {
    expect(parsePlacementInput((k) => ({ event_id: U, player_id: U, place: "2" })[k as "place"])).toEqual({ eventId: U, playerId: U, place: 2 });
  });
  it.each([{ event_id: U, player_id: U, place: "0" }, { event_id: U, player_id: U, place: "1000" }, { event_id: "x", player_id: U, place: "1" }, { event_id: U, player_id: "x", place: "1" }])("rejects %j", (o) => {
    expect(() => parsePlacementInput((k) => (o as Record<string, string>)[k])).toThrow();
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
    const events = upcomingEvents({ now, weekly: { weekday: 6, time: "18:00" }, limit: 3 });
    expect(events.map((e) => e.at.toISOString())).toEqual(["2026-10-10T11:00:00.000Z", "2026-10-17T11:00:00.000Z", "2026-10-24T11:00:00.000Z"]);
    expect(events[0]).toMatchObject({ title: "Ranked", hasTime: true });
  });
  it("upcomingEvents merges scheduled events in date order and trims to the limit", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    const events = upcomingEvents({
      now, weekly: { weekday: 6, time: "18:00" }, limit: 3,
      scheduled: [{ title: "Cup 1", at: new Date("2026-10-12T06:00:00Z") }, { title: "Cup 2", at: new Date("2026-12-01T06:00:00Z") }],
    });
    expect(events.map((e) => e.title)).toEqual(["Ranked", "Cup 1", "Ranked"]);
  });
  it("upcomingEvents ignores past scheduled events and is empty with nothing scheduled", () => {
    const now = new Date("2026-10-08T05:00:00Z");
    expect(upcomingEvents({ now, weekly: null, scheduled: [{ title: "Old", at: new Date("2026-09-01T06:00:00Z") }], limit: 3 })).toEqual([]);
    expect(upcomingEvents({ now, weekly: null, limit: 3 })).toEqual([]);
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
  const ok = { id: A, bom_id: "BoM-012", name: " Sora ", points: "999", wins: "9", losses: "9", status: "active" };
  const player = (o: Record<string, unknown>) => parsePlayerInput((k) => o[k]);
  it("parses an edit and ignores the record fields", () => expect(player(ok)).toEqual({ id: A, bom_id: "BoM-012", name: "Sora", status: "active" }));
  it("rejects bad ids and status", () => {
    expect(() => player({ ...ok, id: "x" })).toThrow();
    expect(() => player({ ...ok, bom_id: "BoM 12!" })).toThrow();
    expect(() => player({ ...ok, status: "banned" })).toThrow();
    expect(() => player({ ...ok, name: "" })).toThrow();
  });
});

import { DEFAULT_POINTS_TABLE } from "@/lib/content";
import { asPointsTable, parsePointsTable } from "@/domain/points-table";

describe("points table", () => {
  const T = DEFAULT_POINTS_TABLE;
  it("is a valid table with a value for every column in every row", () => {
    expect(asPointsTable(JSON.parse(JSON.stringify(T)))).toEqual(T);
    for (const r of [...T.ranks, ...T.categories]) expect(r.values).toHaveLength(T.sizes.length);
  });
  it("pays more for a better place and for a bigger field", () => {
    for (let c = 0; c < T.sizes.length; c++) for (let r = 1; r < T.ranks.length; r++) expect(T.ranks[r - 1].values[c]).toBeGreaterThanOrEqual(T.ranks[r].values[c]);
    for (const r of T.ranks) for (let c = 1; c < r.values.length; c++) expect(r.values[c]).toBeGreaterThanOrEqual(r.values[c - 1]);
  });
  it("rejects a broken table read back from the database", () => {
    expect(asPointsTable(null)).toBeNull();
    expect(asPointsTable({ ...T, ranks: [{ label: "1", values: [1] }] })).toBeNull();
    expect(asPointsTable({ ...T, sizes: [] })).toBeNull();
  });
  it("parses the editor's form fields", () => {
    const form: Record<string, string> = { sizes: "2", ranks: "1", cats: "1", size_0: "< 39", size_1: "40", rank_label_0: "1", rank_0_0: "4", rank_0_1: "5.555", cat_label_0: "Top Cut", cat_0_0: "0.5", cat_0_1: "0.65", note: " n " };
    expect(parsePointsTable((k) => form[k])).toEqual({
      sizes: ["< 39", "40"], ranks: [{ label: "1", values: [4, 5.56] }], categories: [{ label: "Top Cut", values: [0.5, 0.65] }], note: "n",
    });
  });
  it("rejects missing, negative or oversized input", () => {
    const base: Record<string, string> = { sizes: "1", ranks: "1", cats: "0", size_0: "40", rank_label_0: "1", rank_0_0: "4", note: "" };
    expect(() => parsePointsTable((k) => ({ ...base, rank_0_0: "" })[k])).toThrow();
    expect(() => parsePointsTable((k) => ({ ...base, rank_0_0: "-1" })[k])).toThrow();
    expect(() => parsePointsTable((k) => ({ ...base, sizes: "99" })[k])).toThrow();
    expect(() => parsePointsTable((k) => ({ ...base, size_0: "" })[k])).toThrow();
  });
});
