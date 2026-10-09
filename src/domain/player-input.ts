import type { PlayerStatus } from "./types";
import { isUuid, parseText } from "./validation";

/** What an admin can edit about a player. Points are not editable: they are calculated from results. */
export type PlayerInput = { id: string; bom_id: string; name: string; status: PlayerStatus };

/** The BOM ID is part of the member's URL, so it is kept to letters, digits and dashes. */
export function parsePlayerInput(get: (key: string) => unknown): PlayerInput {
  const id = get("id");
  if (!isUuid(id)) throw new Error("Invalid id");
  const bomId = parseText(get("bom_id"), "BOM ID", 20);
  if (!/^[A-Za-z0-9-]+$/.test(bomId)) throw new Error("BOM ID can only use letters, digits and dashes");
  const status = get("status");
  if (status !== "registered" && status !== "active") throw new Error("Invalid status");
  return { id, bom_id: bomId, name: parseText(get("name"), "Blader name", 40), status };
}
