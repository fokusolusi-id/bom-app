/** A Beyblade X combo as typed, "AP 1-80 LR": the blade, then the ratchet (1-80), then the bit (LR). */
export type ComboParts = { blade: string; ratchet: string | null; bit: string | null };

const RATCHET = /(?:^|\s)(\d-\d{2})(?=\s|$)/;

/**
 * Splits a combo into its parts. The ratchet is the "number-number" token; what comes before it is the blade (it can have
 * several words, "EW GH"), what comes after is the bit. Without a ratchet the whole text is taken as the blade.
 */
export function parseCombo(text: string): ComboParts {
  const combo = text.replace(/\s+/g, " ").trim();
  const m = RATCHET.exec(combo);
  if (!m) return { blade: combo, ratchet: null, bit: null };
  const start = m.index + (m[0].startsWith(" ") ? 1 : 0);
  const blade = combo.slice(0, start).trim();
  const bit = combo.slice(start + m[1].length).trim();
  return { blade: blade || combo, ratchet: m[1], bit: bit || null };
}

export type Tally = { name: string; count: number };
export type ComboStats = { combo: Tally | null; blade: Tally | null; ratchet: Tally | null; bit: Tally | null };

/** The most used of `values`, ignoring case. A tie goes to the one used most recently, so pass them newest first. */
function most(values: string[]): Tally | null {
  const counts = new Map<string, Tally>();
  for (const v of values) {
    const key = v.toLowerCase();
    const seen = counts.get(key);
    if (seen) seen.count += 1;
    else counts.set(key, { name: v, count: 1 });
  }
  let best: Tally | null = null;
  for (const t of counts.values()) if (!best || t.count > best.count) best = t;
  return best;
}

/** What a member wins with most: the whole combo, and the blade, ratchet and bit on their own. Combos newest first. */
export function comboStats(combos: string[]): ComboStats {
  const parts = combos.map(parseCombo);
  return {
    combo: most(combos.map((c) => c.replace(/\s+/g, " ").trim())),
    blade: most(parts.map((p) => p.blade)),
    ratchet: most(parts.flatMap((p) => (p.ratchet ? [p.ratchet] : []))),
    bit: most(parts.flatMap((p) => (p.bit ? [p.bit] : []))),
  };
}

/** Every distinct value with how often it appears, ignoring case, most used first. A tie goes to the one that came first, so pass them newest first. */
function tally(values: string[]): Tally[] {
  const counts = new Map<string, Tally>();
  for (const v of values) {
    const key = v.toLowerCase();
    const seen = counts.get(key);
    if (seen) seen.count += 1;
    else counts.set(key, { name: v, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

export type PartsMeta = { total: number; combo: Tally[]; blade: Tally[]; ratchet: Tally[]; bit: Tally[] };

/** What wins across many combos: the most used whole combos, blades, ratchets and bits (`top` of each) and how many combos were counted. Combos newest first. */
export function partsMeta(combos: string[], top = 5): PartsMeta {
  const cleaned = combos.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
  const parts = cleaned.map(parseCombo);
  return {
    total: cleaned.length,
    combo: tally(cleaned).slice(0, top),
    blade: tally(parts.map((p) => p.blade)).slice(0, top),
    ratchet: tally(parts.flatMap((p) => (p.ratchet ? [p.ratchet] : []))).slice(0, top),
    bit: tally(parts.flatMap((p) => (p.bit ? [p.bit] : []))).slice(0, top),
  };
}
