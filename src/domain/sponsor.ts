import { parseImagePath } from "./media";
import { isUuid, parseText } from "./validation";

export const SPONSOR_TIERS = [["gold", "Gold (main sponsor)"], ["silver", "Silver (venue)"], ["bronze", "Bronze (shop)"]] as const;
export type SponsorTier = (typeof SPONSOR_TIERS)[number][0];

export type Sponsor = {
  id?: string; name: string; tier: SponsorTier; logo_path: string; website: string | null; sort_order: number; is_active: boolean;
};
export type SponsorInput = Omit<Sponsor, "id"> & { id?: string };

/** Website of a sponsor: empty means none; otherwise it must be an http(s) URL. */
export function parseWebsite(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return null;
  if (v.length > 200) throw new Error("Website must be at most 200 characters");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    throw new Error("Invalid website");
  }
  if (!url.hostname.includes(".")) throw new Error("Invalid website");
  return url.toString();
}

export function parseSponsorInput(get: (key: string) => unknown): SponsorInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const tier = get("tier");
  if (!SPONSOR_TIERS.some(([t]) => t === tier)) throw new Error("Invalid tier");
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Order must be 0-999");
  const logo = parseImagePath(get("logo_path"), "sponsors");
  if (!logo) throw new Error("Upload a logo first");
  return {
    ...(id ? { id: id as string } : {}),
    name: parseText(get("name"), "Name", 60),
    tier: tier as SponsorTier,
    logo_path: logo,
    website: parseWebsite(get("website")),
    sort_order: order,
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}
