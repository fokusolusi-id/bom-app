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
/** A line of an event's results: a member (`playerId`) or a guest without a BOM ID (`guestName`). */
export type ResultRow = { playerId: string | null; guestName: string | null; place: number | null; tigerKing: boolean };
type Candidate = { id: string; name: string; bom_id: string };

/**
 * Results typed as a list, one member per line (blader name or BOM ID, e.g. "BoM-003", "bom 3" or "3"). The first line
 * is 1st place, the second 2nd, up to 8th; every line after that took part without a place. A line may start with its
 * place ("3. Name") for ties: two members both finishing 3rd. "(TK)" or "*" after a name gives the Tiger King, once.
 * A name that matches no member is saved as a guest (Non BOM ID).
 */
export function parseResultsText(text: string, players: Candidate[]): ResultRow[] {
  const squash = (v: string) => v.toLowerCase().replace(/[\s-]/g, "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Add at least one member");
  const tigerGuests: string[] = [];
  const rows: ResultRow[] = [];
  let previous = 0;
  lines.forEach((line) => {
    const tigerKing = /(\(tk\)|\*)\s*$/i.test(line);
    const withoutMark = line.replace(/(\(tk\)|\*)\s*$/i, "").trim();
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(withoutMark);
    const query = (numbered ? numbered[2] : withoutMark).trim();
    // A place written on the line wins; otherwise it is the one after the previous line.
    const rank = numbered ? Number(numbered[1]) : previous + 1;
    previous = rank;
    // A blader name is matched first, so "3R Zero" stays a name; a BOM ID may be typed as "BoM-003", "bom 3" or just "3".
    const typed = /^(?:bom)?[\s-]*(\d+)$/i.exec(query)?.[1];
    const found =
      players.find((p) => p.name.toLowerCase() === query.toLowerCase()) ??
      players.find((p) => squash(p.bom_id) === squash(query)) ??
      (typed ? players.find((p) => Number(/\d+/.exec(p.bom_id)?.[0]) === Number(typed)) : undefined);
    const place = rank >= 1 && rank <= TOP_PLACES ? rank : null;
    // A name that matches no member is a guest: marked Non BOM ID, counted as a participant, never shown on the site.
    if (found) return void rows.push({ playerId: found.id, guestName: null, place, tigerKing });
    const guestName = query.replace(/\s+/g, " ").slice(0, 60);
    if (tigerKing) return void tigerGuests.push(guestName);
    rows.push({ playerId: null, guestName, place, tigerKing: false });
  });
  if (tigerGuests.length) throw new Error(`${tigerGuests.join(", ")} has no BOM ID, so cannot be Tiger King`);
  const keys = rows.map((r) => r.playerId ?? `guest:${r.guestName!.toLowerCase()}`);
  if (new Set(keys).size !== keys.length) throw new Error("A name is listed twice");
  if (rows.filter((r) => r.tigerKing).length > 1) throw new Error("Only one Tiger King per event");
  return rows;
}
