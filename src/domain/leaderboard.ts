import type { Player } from "./types";

export type SortKey = "points" | "name" | "bom_id";
export type SortDir = "asc" | "desc";

/** The number in a BOM ID: "BoM-012" -> 12. IDs without a number sort last. */
const idNumber = (bomId: string) => Number(/\d+/.exec(bomId)?.[0] ?? Infinity);

/** Players whose blader name or BOM ID contains the search text. Case-insensitive; "bom 12" and "BOM-012" both match. */
export function searchPlayers<T extends Pick<Player, "name" | "bom_id">>(players: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return players;
  const squash = (s: string) => s.toLowerCase().replace(/[\s-]/g, "");
  // "bom 7" or "7" also finds BoM-007: compare the number, not the zero padding.
  const typed = /^(?:bom)?(\d+)$/.exec(squash(q));
  return players.filter(
    (p) => p.name.toLowerCase().includes(q) || squash(p.bom_id).includes(squash(q)) || (typed !== null && idNumber(p.bom_id) === Number(typed[1])),
  );
}

/** Sorted copy. Points default to highest first; names and BOM IDs to ascending. Ties fall back to name. */
export function sortPlayers<T extends Pick<Player, "name" | "bom_id" | "points">>(players: T[], key: SortKey, dir: SortDir): T[] {
  const sign = dir === "asc" ? 1 : -1;
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  const compare = (a: T, b: T) => {
    if (key === "points") return a.points - b.points;
    if (key === "name") return byName(a, b);
    const d = idNumber(a.bom_id) - idNumber(b.bom_id);
    return Number.isNaN(d) || d === 0 ? a.bom_id.localeCompare(b.bom_id) : d;
  };
  return [...players].sort((a, b) => sign * compare(a, b) || byName(a, b));
}

/** Position of every player in the default order (points, highest first; ties by name), keyed by BOM ID. Search and sort never change it. */
export function ranks(players: Pick<Player, "name" | "bom_id" | "points">[]): Map<string, number> {
  return new Map(sortPlayers(players, "points", "desc").map((p, i) => [p.bom_id, i + 1]));
}
