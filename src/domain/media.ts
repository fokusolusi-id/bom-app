export const MEDIA_BUCKET = "media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(",");

export type MediaFolder = "sub-communities";

export function imageExtension(contentType: unknown): string {
  const ext = typeof contentType === "string" ? IMAGE_TYPES[contentType] : undefined;
  if (!ext) throw new Error("Format foto harus JPG, PNG, atau WebP");
  return ext;
}

/** Validates a storage path produced by an upload into `folder`. Empty means "no image". */
export function parseImagePath(raw: unknown, folder: MediaFolder): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const pattern = new RegExp(`^${folder}/[0-9a-f-]{36}\\.(jpg|png|webp)$`);
  if (typeof raw !== "string" || !pattern.test(raw)) throw new Error("Foto tidak valid");
  return raw;
}
