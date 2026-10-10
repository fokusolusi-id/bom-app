import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TIERS } from "@/domain/tier";
import { buildStandings, playerHistory, type HistoryRow, type ScoredEvent, type Standing } from "@/domain/standings";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { supabaseSettings } from "./settings";
import { createPublicClient } from "./supabase-public";

type Row = { id: string; name: string; tier: string; challonge_url: string | null; starts_at: string; event_placements: { player_id: string | null; place: number | null; tiger_king: boolean }[] };

/** Past, shown events that award points, each with the players who took part. */
async function scoredEvents(client: SupabaseClient, nowIso: string): Promise<ScoredEvent[]> {
  const { data, error } = await client
    .from("schedule_events")
    .select("id,name,tier,starts_at,challonge_url,event_placements(player_id,place,tiger_king)")
    .in("tier", TIERS).eq("is_active", true).lte("starts_at", nowIso);
  check(error, "Failed to load results");
  return ((data ?? []) as unknown as Row[]).map((e) => ({
    id: e.id, name: e.name, challongeUrl: e.challonge_url, tier: e.tier, startsAt: e.starts_at,
    participants: e.event_placements.map((p) => ({ playerId: p.player_id, place: p.place, tigerKing: p.tiger_king })),
  }));
}

/** Standings by player id, from the results of past events and the current points table. */
export async function loadStandings(client: SupabaseClient, now = new Date()): Promise<Map<string, Standing>> {
  const [events, table] = await Promise.all([scoredEvents(client, now.toISOString()), supabaseSettings(client).pointsTable()]);
  return buildStandings(events, table);
}

/** A player's results with the points each gave, oldest first. Empty without Supabase or if it cannot be loaded. */
export async function publicPlayerHistory(playerId: string): Promise<HistoryRow[]> {
  if (!hasSupabase() || !playerId) return [];
  try {
    const client = createPublicClient();
    const [events, table] = await Promise.all([scoredEvents(client, new Date().toISOString()), supabaseSettings(client).pointsTable()]);
    return playerHistory(events, table, playerId);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/** Standings for public pages. Empty without Supabase or if they cannot be loaded, so the leaderboard still shows. */
export async function publicStandings(): Promise<Map<string, Standing>> {
  if (!hasSupabase()) return new Map();
  try {
    return await loadStandings(createPublicClient());
  } catch (e) {
    console.error(e);
    return new Map();
  }
}

/** Writes every player's total to `players.points`, so profiles, ranks and the leaderboard order follow the results. Run after any change to results or the points table. */
export async function syncPlayerPoints(client: SupabaseClient, now = new Date()): Promise<void> {
  const [standings, { data, error }] = await Promise.all([loadStandings(client, now), client.from("players").select("id,points")]);
  check(error, "Failed to load players");
  for (const p of (data ?? []) as { id: string; points: number }[]) {
    const total = standings.get(p.id)?.total ?? 0;
    if (Number(p.points) === total) continue;
    const { error: updateError } = await client.from("players").update({ points: total }).eq("id", p.id);
    check(updateError, "Failed to update points");
  }
}
