import { isUuid } from "./validation";

export type PlacementInput = { eventId: string; playerId: string; place: number };

export function parsePlacementInput(get: (key: string) => unknown): PlacementInput {
  const eventId = get("event_id");
  const playerId = get("player_id");
  if (!isUuid(eventId) || !isUuid(playerId)) throw new Error("Invalid input");
  const place = Number(get("place"));
  if (!Number.isInteger(place) || place < 1 || place > 999) throw new Error("Place must be 1-999");
  return { eventId, playerId, place };
}
