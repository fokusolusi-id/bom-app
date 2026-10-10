import { TOP_PLACES } from "./result";

/** A Challonge bracket address, as a canonical link (https://challonge.com/slug or https://sub.challonge.com/slug). Empty means none. */
export function parseChallongeUrl(raw: unknown): { url: string; apiId: string } | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    throw new Error("Invalid Challonge link");
  }
  const host = u.hostname.toLowerCase();
  const slug = u.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!(host === "challonge.com" || host.endsWith(".challonge.com")) || !/^[A-Za-z0-9_]{1,100}$/.test(slug)) throw new Error("Use a Challonge bracket link, like https://challonge.com/your_bracket");
  const sub = host === "challonge.com" || host === "www.challonge.com" ? "" : host.slice(0, -".challonge.com".length);
  if (sub && !/^[a-z0-9-]+$/.test(sub)) throw new Error("Invalid Challonge link");
  return { url: `https://${sub ? `${sub}.` : ""}challonge.com/${slug}`, apiId: sub ? `${sub}-${slug}` : slug };
}

export type ChallongeEntry = { name: string; rank: number | null };

/** The participants of a Challonge tournament (API v1 `include_participants`), best final rank first. */
export function entriesFromChallonge(json: unknown): ChallongeEntry[] {
  const list = (json as { tournament?: { participants?: { participant?: Record<string, unknown> }[] } })?.tournament?.participants;
  if (!Array.isArray(list)) throw new Error("Unexpected answer from Challonge");
  const entries = list.flatMap(({ participant: p }) => {
    const name = [p?.name, p?.display_name, p?.challonge_username].find((n): n is string => typeof n === "string" && n.trim() !== "")?.trim();
    return name ? [{ name, rank: typeof p?.final_rank === "number" ? p.final_rank : null }] : [];
  });
  if (entries.length === 0) throw new Error("This bracket has no participants");
  if (entries.every((e) => e.rank === null)) throw new Error("This bracket has no final ranking yet. Finish it on Challonge first.");
  return entries.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name));
}

type Member = { name: string; bom_id: string };

/**
 * The entries as the results list: one member per line, "3. Name", with the real place from the bracket (two losing
 * semifinalists both finish 3rd). A name is matched to a member by blader name, or by a BOM ID written in it
 * ("Dewa [BoM-001]"); a name that matches nobody is kept as typed and reported, so it can be fixed before saving.
 */
export function challongeResultsText(entries: ChallongeEntry[], members: Member[]): { text: string; unmatched: string[] } {
  const unmatched: string[] = [];
  const lines = entries.map((e) => {
    const id = /bom[\s-]*0*(\d+)/i.exec(e.name)?.[1];
    const found = members.find((m) => m.name.toLowerCase() === e.name.toLowerCase())
      ?? (id ? members.find((m) => Number(/\d+/.exec(m.bom_id)?.[0]) === Number(id)) : undefined);
    if (!found) unmatched.push(e.name);
    const place = e.rank !== null && e.rank <= TOP_PLACES ? `${e.rank}. ` : "";
    return `${place}${found?.name ?? e.name}`;
  });
  return { text: lines.join("\n"), unmatched };
}
