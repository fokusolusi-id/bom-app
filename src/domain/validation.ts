const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Trimmed form text. Empty returns `fallback`, or throws when the field has none (required). */
export function parseText(raw: unknown, label: string, max: number, fallback?: string): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${label} wajib diisi`);
  }
  if (v.length > max) throw new Error(`${label} maksimal ${max} karakter`);
  return v;
}

/** Instagram handle from "@handle", "handle" or an instagram.com profile URL. Empty means none. */
export function parseInstagram(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return null;
  const handle = v.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new Error("Instagram tidak valid");
  return handle;
}
