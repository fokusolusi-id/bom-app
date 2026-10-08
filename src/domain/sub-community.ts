import { isUuid, parseText } from "./validation";

export type SubCommunity = {
  id?: string; name: string; schedule: string; focus: string | null; sort_order: number; is_active: boolean;
};

export type SubCommunityInput = Omit<SubCommunity, "id"> & { id?: string };

export function parseSubCommunityInput(get: (key: string) => unknown): SubCommunityInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Urutan harus 0-999");
  return {
    ...(id ? { id: id as string } : {}),
    name: parseText(get("name"), "Nama", 60),
    schedule: parseText(get("schedule"), "Jadwal", 60),
    focus: parseText(get("focus"), "Fokus", 280, "") || null,
    sort_order: order,
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}
