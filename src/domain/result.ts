import { isUuid } from "./validation";

export const TOP_PLACES = 8;
export const MAX_COMBOS = 3;

/**
 * The winning combos, one per line, up to three. Only the top 8 can have them.
 * A combo is kept as typed ("AP 1-80 LR"), with the spaces tidied.
 */
export function parseCombos(raw: unknown, place: number | null): string[] {
  const lines = (Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? raw.split(/\r?\n/) : []).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (lines.length === 0) return [];
  if (place === null || place < 1 || place > TOP_PLACES) throw new Error("Only the top 8 can have winning combos");
  if (lines.length > MAX_COMBOS) throw new Error(`At most ${MAX_COMBOS} combos each`);
  if (lines.some((l) => l.length > 40)) throw new Error("A combo can be at most 40 characters");
  return lines;
}

export type PlacementInput = { eventId: string; playerId: string; place: number | null; tigerKing: boolean; combos: string[] };

/** A player at an event. `place` may be empty: they took part without a top place. */
export function parsePlacementInput(get: (key: string) => unknown): PlacementInput {
  const eventId = get("event_id");
  const playerId = get("player_id");
  if (!isUuid(eventId) || !isUuid(playerId)) throw new Error("Invalid input");
  const raw = get("place");
  const place = raw === null || raw === undefined || raw === "" ? null : Number(raw);
  if (place !== null && (!Number.isInteger(place) || place < 1 || place > 999)) throw new Error("Place must be 1-999");
  const tigerKing = get("tiger_king") === "on";
  return { eventId, playerId, place, tigerKing, combos: parseCombos(get("combos"), place) };
}

/** A line of an event's results: a member (`playerId`) or a guest without a BOM ID (`guestName`). */
export type ResultRow = { playerId: string | null; guestName: string | null; place: number | null; tigerKing: boolean; combos: string[]; warning?: string };
type Candidate = { id: string; name: string; bom_id: string };

/** A name for comparing: no case, spaces or punctuation, and no "BoM" prefix, so "MR.Dibo" and "BoM Mr. DiBo" both equal "Mr. DiBo". */
const looseName = (v: string) => v.toLowerCase().replace(/^\s*bom[\s-]+/, "").replace(/[^a-z0-9]/g, "");

const NUMBERED = /^(\d+)[.)]?\s+(.*)$/;
const TK_MARK = /(\(tk\)|\*)\s*$/i;

/**
 * An event's results as typed text. Two shapes:
 *
 * - A plain list, one member per line (blader name or BOM ID). The first line is 1st place, the second 2nd, up to 8th;
 *   every line after that took part without a place.
 * - A numbered list, when the first line starts with a place ("1 [BOM-001] Decade (TK)"). Each numbered line is one
 *   member with that place (two members can share 3rd); the lines under it, up to three, are the combos they won with.
 *
 * A member is found by the BOM ID in brackets, else by blader name. "(TK)" or "*" after the name gives the Tiger King,
 * once. A name that matches no member is saved as a guest (Non BOM ID); write "[Non BOM ID]" to make a guest even when a
 * member has the same name. Only the top 8 and the Tiger King can have combos.
 */
export function parseResultsText(text: string, players: Candidate[]): ResultRow[] {
  const squash = (v: string) => v.toLowerCase().replace(/[\s-]/g, "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Add at least one member");
  const numbered = NUMBERED.test(lines[0]);

  // Group the lines into entries: a header, and (in a numbered list) up to three combo lines under a top-8 header.
  // After a blank line, or once a header has its three combos, a plain line is the next member (no place, no combos).
  const entries: { header: string; rank: number | null; combos: string[] }[] = [];
  let closed = false;
  let plainRank = 0;
  for (const line of text.split(/\r?\n/).map((l) => l.trim())) {
    if (line === "") { closed = true; continue; }
    const m = NUMBERED.exec(line);
    const last = entries[entries.length - 1];
    if (!numbered) {
      // A plain list may still number its lines with a dot ("3. Name"), which is the place.
      const dotted = /^(\d+)[.)]\s+(.*)$/.exec(line);
      entries.push({ header: dotted ? dotted[2] : line, rank: dotted ? Number(dotted[1]) : null, combos: [] });
    } else if (m) {
      entries.push({ header: m[2], rank: Number(m[1]), combos: [] });
      plainRank = Number(m[1]);
      closed = false;
    } else if (last && !closed && last.rank !== null && last.rank >= 1 && last.rank <= TOP_PLACES && last.combos.length < MAX_COMBOS) {
      last.combos.push(line);
    } else {
      plainRank += 1;
      entries.push({ header: line, rank: plainRank, combos: [] });
    }
  }

  const tigerGuests: string[] = [];
  const rows: ResultRow[] = [];
  let previous = 0;
  for (const entry of entries) {
    const tigerKing = TK_MARK.test(entry.header);
    let rest = entry.header.replace(TK_MARK, "").trim();
    // "[BOM-012]" names the member; "[Non BOM ID]" forces a guest. Anything else in brackets is ignored.
    const tag = /\[([^\]]*)\]/.exec(rest)?.[1] ?? "";
    rest = rest.replace(/\[[^\]]*\]/, " ").replace(/\s+/g, " ").trim();
    const forceGuest = /non|guest/i.test(tag);
    const tagged = /bom[\s-]*0*(\d+)/i.exec(tag)?.[1];
    const rank = entry.rank ?? previous + 1;
    previous = rank;
    const place = rank >= 1 && rank <= TOP_PLACES ? rank : null;
    const typed = /^(?:bom)?[\s-]*(\d+)$/i.exec(rest)?.[1];
    const idOf = (m: Candidate) => Number(/\d+/.exec(m.bom_id)?.[0]);
    // A blader name is matched first, so "3R Zero" stays a name; a BOM ID may be typed as "BoM-003", "bom 3" or just "3".
    // The BOM ID in brackets is checked first, then the name (ignoring case, spaces and punctuation), then a BOM ID typed as the name.
    const byId = forceGuest || !tagged ? undefined : players.find((p) => idOf(p) === Number(tagged));
    const found = forceGuest ? undefined
      : byId
        ?? players.find((p) => p.name.toLowerCase() === rest.toLowerCase())
        ?? (looseName(rest) ? players.find((p) => looseName(p.name) === looseName(rest)) : undefined)
        ?? players.find((p) => squash(p.bom_id) === squash(rest))
        ?? (typed ? players.find((p) => idOf(p) === Number(typed)) : undefined);
    // Both given but they point at different members (or the name looks nothing like the member): the BOM ID wins, and it is flagged.
    const alike = (a: string, b: string) => !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 3 && (a.includes(b) || b.includes(a))));
    const warning = byId && looseName(rest) && !alike(looseName(rest), looseName(byId.name)) ? `BOM ID says ${byId.name}, the name says "${rest}"` : undefined;
    const combos = parseCombos(entry.combos, place);
    if (found) {
      rows.push({ playerId: found.id, guestName: null, place, tigerKing, combos, ...(warning ? { warning } : {}) });
    } else {
      // Marked Non BOM ID: counted as a participant, never shown on the leaderboard.
      const guestName = rest.slice(0, 60);
      if (!guestName) throw new Error("A line has no name");
      if (tigerKing) tigerGuests.push(guestName);
      else rows.push({ playerId: null, guestName, place, tigerKing: false, combos });
    }
  }
  if (tigerGuests.length) throw new Error(`${tigerGuests.join(", ")} has no BOM ID, so cannot be Tiger King`);
  const keys = rows.map((r) => r.playerId ?? `guest:${r.guestName!.toLowerCase()}`);
  if (new Set(keys).size !== keys.length) throw new Error("A name is listed twice");
  if (rows.filter((r) => r.tigerKing).length > 1) throw new Error("Only one Tiger King per event");
  return rows;
}

/** Results as the text they are typed in: "1 [BOM-001] Name (TK)", the combos, a blank line between entries. The BOM IDs are the detected ones. */
export function formatResultsText(rows: ResultRow[], players: Candidate[]): string {
  const byId = new Map(players.map((p) => [p.id, p]));
  return rows
    .map((r) => {
      const member = r.playerId ? byId.get(r.playerId) : undefined;
      const tag = member ? `[${member.bom_id.toUpperCase()}]` : "[Non BOM ID]";
      return [`${r.place === null ? "" : `${r.place} `}${tag} ${member?.name ?? r.guestName}${r.tigerKing ? " (TK)" : ""}`, ...r.combos].join("\n");
    })
    .join("\n\n");
}
