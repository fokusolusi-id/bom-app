import "server-only";
import { partsMeta, type PartsMeta } from "@/domain/combos";
import { TIERS } from "@/domain/tier";
import { hasSupabase } from "@/lib/supabase/env";
import { createPublicClient } from "./supabase-public";

export type WinningMeta = PartsMeta & { events: number };

/**
 * What the top eight of Ranked, Major and Championship events won with. Unrank is left out: it is casual and has no points.
 * Guests count too, since this is about the game and not the leaderboard. Empty without Supabase or if it cannot be loaded.
 */
export async function publicWinningMeta(now = new Date()): Promise<WinningMeta> {
  const empty: WinningMeta = { ...partsMeta([]), events: 0 };
  if (!hasSupabase()) return empty;
  try {
    const { data, error } = await createPublicClient()
      .from("schedule_events")
      .select("starts_at,event_placements(place,combos)")
      .in("tier", TIERS).eq("is_active", true).lte("starts_at", now.toISOString())
      .order("starts_at", { ascending: false });
    if (error) throw error;
    type Row = { starts_at: string; event_placements: { place: number | null; combos: string[] | null }[] };
    let events = 0;
    const combos: string[] = [];
    for (const e of (data ?? []) as unknown as Row[]) {
      const won = e.event_placements.filter((p) => p.place !== null && p.place <= 8).flatMap((p) => p.combos ?? []);
      if (won.length > 0) events += 1;
      combos.push(...won);
    }
    return { ...partsMeta(combos), events };
  } catch (e) {
    console.error(e);
    return empty;
  }
}
