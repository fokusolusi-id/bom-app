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
