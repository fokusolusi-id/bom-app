import { parseImagePath } from "./media";
import { isUuid, parseInstagram, parseText } from "./validation";

export type SubCommunity = {
  id?: string; name: string; focus: string | null; sort_order: number; is_active: boolean; image_path: string | null; instagram: string | null;
};

export type SubCommunityInput = Omit<SubCommunity, "id"> & { id?: string };

export function parseSubCommunityInput(get: (key: string) => unknown): SubCommunityInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Order must be 0-999");
  return {
    ...(id ? { id: id as string } : {}),
    name: parseText(get("name"), "Name", 60),
    focus: parseText(get("focus"), "Focus", 280, "") || null,
    sort_order: order,
    is_active: get("is_active") === "on" || get("is_active") === "true",
    image_path: parseImagePath(get("image_path"), "sub-communities"),
    instagram: parseInstagram(get("instagram")),
  };
}
