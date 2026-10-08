import { parseTier, type Tier } from "./tier";
import { isUuid, parseText } from "./validation";

export type TournamentInput = { id?: string; name: string; tier: Tier; held_on: string };
export type PlacementInput = { tournamentId: string; playerId: string; place: number };

export function parseTournamentInput(get: (key: string) => unknown): TournamentInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const heldOn = parseText(get("held_on"), "Tanggal", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(heldOn) || Number.isNaN(Date.parse(heldOn))) throw new Error("Tanggal tidak valid");
  return {
    ...(id ? { id: id as string } : {}),
    name: parseText(get("name"), "Nama", 80),
    tier: parseTier(get("tier")),
    held_on: heldOn,
  };
}

export function parsePlacementInput(get: (key: string) => unknown): PlacementInput {
  const tournamentId = get("tournament_id");
  const playerId = get("player_id");
  if (!isUuid(tournamentId) || !isUuid(playerId)) throw new Error("Invalid input");
  const place = Number(get("place"));
  if (!Number.isInteger(place) || place < 1 || place > 999) throw new Error("Posisi harus 1-999");
  return { tournamentId, playerId, place };
}
