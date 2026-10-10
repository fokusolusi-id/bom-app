import { parseWebsite } from "./sponsor";
import { parseText } from "./validation";

export type Rulebook = { title: string; note: string; href: string };
export type RulesPage = { intro: string; rulebooks: Rulebook[]; summary: string };

export const RULEBOOK_SLOTS = 3;

/**
 * The rules editor's form fields. Rulebook rows come as `rb_title_i`, `rb_note_i`, `rb_href_i` for each slot; a slot
 * with nothing in it is skipped, and one with only some of the fields is an error.
 */
export function parseRulesPage(get: (key: string) => unknown): RulesPage {
  const rulebooks: Rulebook[] = [];
  for (let i = 0; i < RULEBOOK_SLOTS; i++) {
    const title = parseText(get(`rb_title_${i}`), "Title", 80, "");
    const note = parseText(get(`rb_note_${i}`), "Edition", 80, "");
    const rawHref = typeof get(`rb_href_${i}`) === "string" ? (get(`rb_href_${i}`) as string).trim() : "";
    if (!title && !note && !rawHref) continue;
    if (!title || !rawHref) throw new Error(`Rulebook ${i + 1} needs a title and a link`);
    rulebooks.push({ title, note, href: parseWebsite(rawHref) as string });
  }
  return { intro: parseText(get("intro"), "Intro", 300, ""), rulebooks, summary: parseText(get("summary"), "Summary", 1500, "") };
}

/** A page read back from the database: used only if it has the right shape. */
export function asRulesPage(value: unknown): RulesPage | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<RulesPage>;
  const ok = Array.isArray(v.rulebooks) && v.rulebooks.every((r) => typeof r?.title === "string" && typeof r.note === "string" && typeof r.href === "string");
  return ok && typeof v.intro === "string" && typeof v.summary === "string" ? (v as RulesPage) : null;
}
