import { describe, expect, it } from "vitest";
import { canManageEvent, canManageResults, parseNewPassword, parseStaffInput } from "@/domain/access";

const DXM = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const admin = { isAdmin: true, communityIds: [] };
const organizer = { isAdmin: false, communityIds: [DXM] };

describe("who may manage what", () => {
  it("lets admins manage everything", () => {
    expect(canManageEvent(admin, { sub_community_id: null, tier: "Championship" })).toBe(true);
    expect(canManageResults(admin, { sub_community_id: null, tier: "Cup" })).toBe(true);
  });

  it("lets an organizer manage Unrank and Ranked events of their own community only", () => {
    expect(canManageEvent(organizer, { sub_community_id: DXM, tier: "Ranked" })).toBe(true);
    expect(canManageEvent(organizer, { sub_community_id: DXM, tier: "Unrank" })).toBe(true);
    expect(canManageEvent(organizer, { sub_community_id: DXM, tier: "Cup" })).toBe(false);
    expect(canManageEvent(organizer, { sub_community_id: OTHER, tier: "Ranked" })).toBe(false);
    expect(canManageEvent(organizer, { sub_community_id: null, tier: "Ranked" })).toBe(false);
  });

  it("lets an organizer enter results for their own Ranked events only", () => {
    expect(canManageResults(organizer, { sub_community_id: DXM, tier: "Ranked" })).toBe(true);
    expect(canManageResults(organizer, { sub_community_id: DXM, tier: "Unrank" })).toBe(false);
    expect(canManageResults(organizer, { sub_community_id: OTHER, tier: "Ranked" })).toBe(false);
  });
});

describe("staff forms", () => {
  const form = (o: Record<string, string>) => (k: string) => o[k] ?? "";
  const base = { email: " Dxm@Example.com ", password: "correct horse", role: "organizer", sub_community_id: DXM };

  it("reads an organizer and needs their community", () => {
    expect(parseStaffInput(form(base))).toEqual({ email: "dxm@example.com", password: "correct horse", role: "organizer", subCommunityId: DXM });
    expect(() => parseStaffInput(form({ ...base, sub_community_id: "" }))).toThrow(/sub community/i);
  });

  it("gives an admin no community, and rejects bad input", () => {
    expect(parseStaffInput(form({ ...base, role: "admin" })).subCommunityId).toBeNull();
    expect(() => parseStaffInput(form({ ...base, email: "nope" }))).toThrow(/email/i);
    expect(() => parseStaffInput(form({ ...base, password: "short" }))).toThrow(/password/i);
    expect(() => parseStaffInput(form({ ...base, role: "boss" }))).toThrow(/role/i);
  });

  it("checks the new password twice", () => {
    expect(parseNewPassword(form({ password: "a long password", confirm: "a long password" }))).toBe("a long password");
    expect(() => parseNewPassword(form({ password: "a long password", confirm: "different one" }))).toThrow(/not the same/i);
  });
});
