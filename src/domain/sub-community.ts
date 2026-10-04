import { isUuid } from "./match-input";

export type SubCommunity = {
  id?: string; name: string; schedule: string; focus: string | null; sort_order: number; is_active: boolean;
};

export type SubCommunityInput = Omit<SubCommunity, "id"> & { id?: string };

function required(raw: unknown, label: string, max: number): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) throw new Error(`${label} wajib diisi`);
  if (v.length > max) throw new Error(`${label} maksimal ${max} karakter`);
  return v;
}

export function parseSubCommunityInput(get: (key: string) => unknown): SubCommunityInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const focusRaw = typeof get("focus") === "string" ? (get("focus") as string).trim() : "";
  if (focusRaw.length > 280) throw new Error("Fokus maksimal 280 karakter");
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Urutan harus 0-999");
  return {
    ...(id ? { id: id as string } : {}),
    name: required(get("name"), "Nama", 60),
    schedule: required(get("schedule"), "Jadwal", 60),
    focus: focusRaw || null,
    sort_order: order,
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}
