/** Display form of a BOM ID: "BoM-001" -> "[BOM-001]". Stored ids are unchanged. */
export const formatBomId = (bomId: string) => `[${bomId.toUpperCase()}]`;

/** URL ids look like "bom-001". Returns the trimmed id, or null when it can't be a BOM ID. */
export function normalizeBomId(raw: string): string | null {
  const v = raw.trim();
  return /^[A-Za-z0-9-]{1,20}$/.test(v) ? v : null;
}

/** 1-based leaderboard position; ties share the better rank. */
export function rankOf(points: number, allPoints: number[]): number {
  return allPoints.filter((p) => p > points).length + 1;
}
