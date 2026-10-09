import { parseText } from "./validation";

export type PointsRow = { label: string; values: number[] };
export type PointsTable = { sizes: string[]; ranks: PointsRow[]; categories: PointsRow[]; note: string };

export const POINTS_LIMITS = { sizes: 12, ranks: 20, categories: 10 } as const;

const num = (v: unknown, label: string): number => {
  const n = Number(v);
  if (typeof v === "string" && v.trim() === "") throw new Error(`${label} is empty`);
  if (!Number.isFinite(n) || n < 0 || n > 10000) throw new Error(`${label} must be a number from 0 to 10000`);
  return Math.round(n * 100) / 100;
};

function rows(get: (key: string) => unknown, prefix: "rank" | "cat", count: number, sizes: number): PointsRow[] {
  return Array.from({ length: count }, (_, i) => ({
    label: parseText(get(`${prefix}_label_${i}`), "Row label", 30),
    values: Array.from({ length: sizes }, (_, j) => num(get(`${prefix}_${i}_${j}`), `Row "${String(get(`${prefix}_label_${i}`))}" column ${j + 1}`)),
  }));
}

/** The editor's form fields as a table: `sizes`, `ranks` and `cats` count the columns and rows, the rest are indexed inputs. */
export function parsePointsTable(get: (key: string) => unknown): PointsTable {
  const dim = (key: string, max: number, min: number) => {
    const n = Number(get(key));
    if (!Number.isInteger(n) || n < min || n > max) throw new Error("Invalid table size");
    return n;
  };
  const sizeCount = dim("sizes", POINTS_LIMITS.sizes, 1);
  const rankCount = dim("ranks", POINTS_LIMITS.ranks, 1);
  const catCount = dim("cats", POINTS_LIMITS.categories, 0);
  return {
    sizes: Array.from({ length: sizeCount }, (_, j) => parseText(get(`size_${j}`), "Column heading", 12)),
    ranks: rows(get, "rank", rankCount, sizeCount),
    categories: rows(get, "cat", catCount, sizeCount),
    note: parseText(get("note"), "Note", 200, ""),
  };
}

/** A table read back from the database: used only if it has exactly the right shape, so a bad row can't break the page. */
export function asPointsTable(value: unknown): PointsTable | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<PointsTable>;
  const okRows = (r: unknown, n: number) =>
    Array.isArray(r) && r.every((x) => typeof x?.label === "string" && Array.isArray(x.values) && x.values.length === n && x.values.every((y: unknown) => typeof y === "number"));
  if (!Array.isArray(v.sizes) || v.sizes.length === 0 || !v.sizes.every((s) => typeof s === "string")) return null;
  if (!okRows(v.ranks, v.sizes.length) || !okRows(v.categories, v.sizes.length) || typeof v.note !== "string") return null;
  return v as PointsTable;
}
