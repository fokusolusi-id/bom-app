import { isUuid, parseText } from "./validation";
import { MAX_COMBOS, TOP_PLACES, type ResultRow } from "./result";

/**
 * The BOM ID inside what a card's QR code holds: the member page address ("https://…/member/bom-001") or a bare BOM ID.
 * Returns null for anything else, so a random QR code is not taken for a member.
 */
export function parseScannedBomId(text: string): string | null {
  const raw = text.trim();
  const fromUrl = /\/member\/([^/?#\s]+)/i.exec(raw)?.[1];
  let candidate = fromUrl ?? raw;
  try { candidate = decodeURIComponent(candidate); } catch { /* keep as is */ }
  return /^bom-\d{1,6}$/i.test(candidate.trim()) ? candidate.trim().toLowerCase() : null;
}

/** The combos typed at check-in: one per line or field, up to three, kept as typed with the spaces tidied. */
export function parseCheckinCombos(raw: unknown): string[] {
  const lines = (Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? raw.split(/\r?\n/) : []).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (lines.length > MAX_COMBOS) throw new Error(`At most ${MAX_COMBOS} combos each`);
  if (lines.some((l) => l.length > 40)) throw new Error("A combo can be at most 40 characters");
  return lines;
}

/** Who is checked in: a member or a guest, and the combos. `id` is set when editing an existing check-in. */
export type CheckinInput = { eventId: string; playerId: string | null; guestName: string | null; combos: string[] };

export function parseCheckinInput(get: (key: string) => unknown): CheckinInput {
  const eventId = get("event_id");
  if (!isUuid(eventId)) throw new Error("Invalid input");
  const playerId = get("player_id");
  const hasPlayer = playerId !== null && playerId !== undefined && playerId !== "";
  if (hasPlayer && !isUuid(playerId)) throw new Error("Invalid input");
  const guestName = hasPlayer ? null : parseText(get("guest_name"), "Name", 60).replace(/\s+/g, " ");
  return { eventId, playerId: hasPlayer ? (playerId as string) : null, guestName, combos: parseCheckinCombos(get("combos")) };
}

/** A check-in as the results need it. */
export type CheckinCombos = { playerId: string | null; guestName: string | null; combos: string[] };

/**
 * Completes results with the combos taken at check-in. A top-8 row (that is where combos show) whose member or guest checked
 * in with combos gets those, instead of what was typed in the results. Everything else is left as it is.
 */
export function withCheckinCombos(rows: ResultRow[], checkins: CheckinCombos[]): ResultRow[] {
  const byPlayer = new Map(checkins.flatMap((c) => (c.playerId && c.combos.length ? [[c.playerId, c.combos] as const] : [])));
  const byGuest = new Map(checkins.flatMap((c) => (c.guestName && c.combos.length ? [[c.guestName.toLowerCase(), c.combos] as const] : [])));
  return rows.map((r) => {
    if (r.place === null || r.place < 1 || r.place > TOP_PLACES) return r;
    const combos = (r.playerId ? byPlayer.get(r.playerId) : r.guestName ? byGuest.get(r.guestName.toLowerCase()) : undefined);
    return combos ? { ...r, combos } : r;
  });
}
