import { isVideoPath, parseImagePath } from "./media";
import { isUuid, parseText } from "./validation";

export const SECTIONS = ["hero", "gallery"] as const;
export type MediaSection = (typeof SECTIONS)[number];

export type SiteMedia = {
  id?: string; section: MediaSection; kind: "image" | "video"; path: string; caption: string | null; sort_order: number; is_active: boolean;
};
export type SiteMediaInput = Omit<SiteMedia, "id"> & { id?: string };

export function parseSection(raw: unknown): MediaSection {
  if (raw !== "hero" && raw !== "gallery") throw new Error("Invalid section");
  return raw;
}

export function parseSiteMediaInput(get: (key: string) => unknown): SiteMediaInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const section = parseSection(get("section"));
  const path = parseImagePath(get("path"), section);
  if (!path) throw new Error("Upload foto atau video dulu");
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Urutan harus 0-999");
  return {
    ...(id ? { id: id as string } : {}),
    section, path,
    kind: isVideoPath(path) ? "video" : "image",
    caption: parseText(get("caption"), "Keterangan", 120, "") || null,
    sort_order: order,
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}
