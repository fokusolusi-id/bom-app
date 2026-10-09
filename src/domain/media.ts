export const MEDIA_BUCKET = "media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(",");

export type MediaFolder = "sub-communities" | "founding-team" | "hero" | "gallery";

// Sub community uploads are uuid-named; founding team photos may also be hand-named (e.g. dewa.jpg).
const FILE_NAME: Record<MediaFolder, string> = {
  "sub-communities": "[0-9a-f-]{36}", "founding-team": "[A-Za-z0-9_-]{1,80}", hero: "[A-Za-z0-9_-]{1,80}", gallery: "[A-Za-z0-9_-]{1,80}",
};

export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
export const MEDIA_ACCEPT = [...Object.keys(IMAGE_TYPES), ...Object.keys(VIDEO_TYPES)].join(",");
const VIDEO_FOLDERS: MediaFolder[] = ["hero"];

/** Extension for an upload into `folder`; videos are only allowed in the homepage slider. */
export function mediaExtension(contentType: unknown, folder: MediaFolder): string {
  const video = typeof contentType === "string" ? VIDEO_TYPES[contentType] : undefined;
  if (video) {
    if (!VIDEO_FOLDERS.includes(folder)) throw new Error("Video hanya untuk slider beranda");
    return video;
  }
  return imageExtension(contentType);
}

export const isVideoPath = (path: string) => /\.(mp4|webm)$/i.test(path);

export function imageExtension(contentType: unknown): string {
  const ext = typeof contentType === "string" ? IMAGE_TYPES[contentType] : undefined;
  if (!ext) throw new Error("Format foto harus JPG, PNG, atau WebP");
  return ext;
}

/** Validates a storage path produced by an upload into `folder`. Empty means "no image". */
export function parseImagePath(raw: unknown, folder: MediaFolder): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const exts = VIDEO_FOLDERS.includes(folder) ? "jpg|png|webp|mp4|webm" : "jpg|png|webp";
  const pattern = new RegExp(`^${folder}/${FILE_NAME[folder]}\\.(${exts})$`);
  if (typeof raw !== "string" || !pattern.test(raw)) throw new Error("Foto tidak valid");
  return raw;
}

export const PROOF_BUCKET = "payment-proofs";
const PROOF_PATH = /^proofs\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** Storage path of an uploaded payment screenshot, e.g. proofs/<uuid>.png. */
export function parsePaymentProofPath(raw: unknown): string {
  if (typeof raw !== "string" || !PROOF_PATH.test(raw)) throw new Error("Upload screenshot bukti pembayaran");
  return raw;
}
