import { parseImagePath } from "./media";
import { isUuid, parseText } from "./validation";
import { parseYoutubeId } from "./youtube";

export const SECTIONS = ["news", "gallery"] as const;
export type MediaSection = (typeof SECTIONS)[number];

/** `image` for the gallery; `video` (uploaded file) or `youtube` for What's new. */
export type SiteMedia = {
  id?: string; section: MediaSection; kind: "image" | "video" | "youtube";
  path: string | null; youtube_id: string | null; caption: string | null; sort_order: number; is_active: boolean;
};
export type SiteMediaInput = Omit<SiteMedia, "id"> & { id?: string };

export function parseSection(raw: unknown): MediaSection {
  if (raw !== "news" && raw !== "gallery") throw new Error("Invalid section");
  return raw;
}

export function parseSiteMediaInput(get: (key: string) => unknown): SiteMediaInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const section = parseSection(get("section"));
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Order must be 0-999");

  const path = parseImagePath(get("path"), section);
  const link = typeof get("youtube_url") === "string" ? (get("youtube_url") as string).trim() : "";
  let kind: SiteMedia["kind"];
  let youtubeId: string | null = null;
  if (section === "gallery") {
    if (!path) throw new Error("Upload a photo first");
    kind = "image";
  } else if (link) {
    if (path) throw new Error("Choose one: an uploaded video or a YouTube link");
    youtubeId = parseYoutubeId(link);
    if (!youtubeId) throw new Error("Invalid YouTube link");
    kind = "youtube";
  } else {
    if (!path) throw new Error("Upload a video or paste a YouTube link");
    kind = "video";
  }
  return {
    ...(id ? { id: id as string } : {}),
    section, kind, path: youtubeId ? null : path, youtube_id: youtubeId,
    caption: parseText(get("caption"), "Caption", 120, "") || null,
    sort_order: order,
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}
