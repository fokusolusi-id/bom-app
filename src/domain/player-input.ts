import type { PlayerStatus } from "./types";
import { isUuid, parseText } from "./validation";

export type PlayerInput = { id: string; bom_id: string; name: string; points: number; wins: number; losses: number; status: PlayerStatus };

function count(raw: unknown, label: string, max: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`${label} must be a whole number from 0 to ${max}`);
  return n;
}

/** Admin edit of one player. The BOM ID is part of the member's URL, so it is kept to letters, digits and dashes. */
export function parsePlayerInput(get: (key: string) => unknown): PlayerInput {
  const id = get("id");
  if (!isUuid(id)) throw new Error("Invalid id");
  const bomId = parseText(get("bom_id"), "BOM ID", 20);
  if (!/^[A-Za-z0-9-]+$/.test(bomId)) throw new Error("BOM ID can only use letters, digits and dashes");
  const status = get("status");
  if (status !== "registered" && status !== "active") throw new Error("Invalid status");
  return {
    id, bom_id: bomId, name: parseText(get("name"), "Blader name", 40),
    points: count(get("points"), "Points", 100000), wins: count(get("wins"), "Wins", 10000), losses: count(get("losses"), "Losses", 10000), status,
  };
}
