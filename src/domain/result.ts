import { isUuid } from "./validation";

export type PlacementInput = { eventId: string; playerId: string; place: number | null; tigerKing: boolean };

/** A player at an event. `place` may be empty: they took part without a top place. */
export function parsePlacementInput(get: (key: string) => unknown): PlacementInput {
  const eventId = get("event_id");
  const playerId = get("player_id");
  if (!isUuid(eventId) || !isUuid(playerId)) throw new Error("Invalid input");
  const raw = get("place");
  const place = raw === null || raw === undefined || raw === "" ? null : Number(raw);
  if (place !== null && (!Number.isInteger(place) || place < 1 || place > 999)) throw new Error("Place must be 1-999");
  return { eventId, playerId, place, tigerKing: get("tiger_king") === "on" };
}

export const TOP_PLACES = 8;
export type ResultRow = { playerId: string; place: number | null; tigerKing: boolean };
type Candidate = { id: string; name: string; bom_id: string };

/**
 * Results typed as a list, one player per line (blader name or BOM ID, e.g. "BoM-003", "bom 3" or "3"). The first line is 1st place, the second 2nd,
 * up to 8th; every line after that took part without a place. "(TK)" or "*" after a name gives the Tiger King, once.
 */
export function parseResultsText(text: string, players: Candidate[]): ResultRow[] {
  const squash = (v: string) => v.toLowerCase().replace(/[\s-]/g, "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Add at least one player");
  const missing: string[] = [];
  const rows: ResultRow[] = [];
  lines.forEach((line, i) => {
    const tigerKing = /(\(tk\)|\*)\s*$/i.test(line);
    const query = line.replace(/(\(tk\)|\*)\s*$/i, "").replace(/^\d+[.)]\s+/, "").trim();
    // A BOM ID may be typed as "BoM-003", "bom 3" or just "3"; a blader name is matched first, so "3R Zero" stays a name.
    const typed = /^(?:bom)?[\s-]*(\d+)$/i.exec(query)?.[1];
    const found =
      players.find((p) => p.name.toLowerCase() === query.toLowerCase()) ??
      players.find((p) => squash(p.bom_id) === squash(query)) ??
      (typed ? players.find((p) => Number(/\d+/.exec(p.bom_id)?.[0]) === Number(typed)) : undefined);
    if (!found) return void missing.push(query);
    rows.push({ playerId: found.id, place: i < TOP_PLACES ? i + 1 : null, tigerKing });
  });
  if (missing.length) throw new Error(`Player not found: ${missing.join(", ")}`);
  if (new Set(rows.map((r) => r.playerId)).size !== rows.length) throw new Error("A player is listed twice");
  if (rows.filter((r) => r.tigerKing).length > 1) throw new Error("Only one Tiger King per event");
  return rows;
}
