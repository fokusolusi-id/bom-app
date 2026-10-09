import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlacementInput } from "@/domain/result";
import type { PlacementRow } from "@/domain/types";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

/** Events that can have results: the big competitions. */
const RESULT_TIERS = ["Cup", "Major", "Championship"];

export type Podium = { name: string; tier: string; startsAt: string; champion: string; runnerUp: string | null };

export interface ResultsRepository {
  /** Most recent past Cup, Major or Championship (shown on the site) that has a champion recorded. */
  latestPodium(nowIso: string): Promise<Podium | null>;
  /** A player's places at events, newest first. Only events shown on the site. */
  placementsForPlayer(playerId: string): Promise<PlacementRow[]>;
  /** Places recorded for these events, for the admin. */
  placementsForEvents(eventIds: string[]): Promise<{ event_id: string; player_id: string; place: number }[]>;
  setPlacement(input: PlacementInput): Promise<void>;
  removePlacement(eventId: string, playerId: string): Promise<void>;
}

export function supabaseResults(client: SupabaseClient): ResultsRepository {
  return {
    async latestPodium(nowIso) {
      const { data, error } = await client
        .from("schedule_events")
        .select("name,tier,starts_at,event_placements(place,player:players(name))")
        .in("tier", RESULT_TIERS).eq("is_active", true).lte("starts_at", nowIso)
        .order("starts_at", { ascending: false }).limit(10);
      check(error, "Failed to load latest result");
      type Row = { name: string; tier: string; starts_at: string; event_placements: { place: number; player: { name: string } | null }[] };
      for (const e of (data ?? []) as unknown as Row[]) {
        const name = (place: number) => e.event_placements.find((p) => p.place === place)?.player?.name ?? null;
        const champion = name(1);
        if (champion) return { name: e.name, tier: e.tier, startsAt: e.starts_at, champion, runnerUp: name(2) };
      }
      return null;
    },
    async placementsForPlayer(playerId) {
      const { data, error } = await client
        .from("event_placements")
        .select("place,event:schedule_events!inner(id,name,tier,starts_at,is_active)")
        .eq("player_id", playerId);
      check(error, "Failed to load placements");
      const rows = (data ?? []) as unknown as (PlacementRow & { event: { is_active: boolean } })[];
      return rows.filter((r) => r.event.is_active).sort((a, b) => b.event.starts_at.localeCompare(a.event.starts_at));
    },
    async placementsForEvents(eventIds) {
      if (eventIds.length === 0) return [];
      const { data, error } = await client.from("event_placements").select("event_id,player_id,place").in("event_id", eventIds);
      check(error, "Failed to load placements");
      return (data ?? []) as { event_id: string; player_id: string; place: number }[];
    },
    async setPlacement({ eventId, playerId, place }) {
      const { error } = await client.from("event_placements").upsert({ event_id: eventId, player_id: playerId, place });
      check(error, "Failed to save placement");
    },
    async removePlacement(eventId, playerId) {
      const { error } = await client.from("event_placements").delete().eq("event_id", eventId).eq("player_id", playerId);
      check(error, "Failed to remove placement");
    },
  };
}

/** Results for public pages. Nothing without Supabase. */
export function publicResults(): Pick<ResultsRepository, "latestPodium" | "placementsForPlayer"> {
  return hasSupabase() ? supabaseResults(createPublicClient()) : { latestPodium: async () => null, placementsForPlayer: async () => [] };
}
