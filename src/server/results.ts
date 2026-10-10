import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlacementInput, ResultRow } from "@/domain/result";
import type { PlacementRow } from "@/domain/types";
import { TIERS } from "@/domain/tier";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";


/** The top eight of an event, in order, with its sub community. */
export type Podium = { name: string; tier: string; startsAt: string; communityLogo: string | null; communityName: string | null; participants: number; top: { place: number; name: string; bomId: string; tigerKing: boolean }[] };

export interface ResultsRepository {
  /** The most recent past events (shown on the site) that have a champion recorded, newest first. */
  recentPodiums(nowIso: string, limit: number): Promise<Podium[]>;
  /** A player's places at events, newest first. Only events shown on the site. */
  placementsForPlayer(playerId: string): Promise<PlacementRow[]>;
  /** Places recorded for these events, for the admin. */
  placementsForEvents(eventIds: string[]): Promise<{ event_id: string; player_id: string; place: number | null; tiger_king: boolean }[]>;
  setPlacement(input: PlacementInput): Promise<void>;
  removePlacement(eventId: string, playerId: string): Promise<void>;
  /** Makes these rows the whole result of the event: new ones are added, changed ones updated, the rest removed. */
  replaceForEvent(eventId: string, rows: ResultRow[]): Promise<void>;
}

export function supabaseResults(client: SupabaseClient): ResultsRepository {
  return {
    async recentPodiums(nowIso, limit) {
      const { data, error } = await client
        .from("schedule_events")
        .select("name,tier,starts_at,community:sub_communities(name,image_path),event_placements(place,tiger_king,player:players(name,bom_id))")
        .in("tier", TIERS).eq("is_active", true).lte("starts_at", nowIso)
        .order("starts_at", { ascending: false }).limit(30);
      check(error, "Failed to load latest results");
      type Row = { name: string; tier: string; starts_at: string; community: { name: string; image_path: string | null } | null; event_placements: { place: number | null; tiger_king: boolean; player: { name: string; bom_id: string } | null }[] };
      return ((data ?? []) as unknown as Row[])
        .map((e) => ({
          name: e.name, tier: e.tier, startsAt: e.starts_at, communityLogo: e.community?.image_path ?? null, communityName: e.community?.name ?? null, participants: e.event_placements.length,
          top: e.event_placements
            .flatMap((p) => (p.place !== null && p.place <= 8 && p.player ? [{ place: p.place, name: p.player.name, bomId: p.player.bom_id, tigerKing: p.tiger_king }] : []))
            .sort((a, b) => a.place - b.place),
        }))
        .filter((p) => p.top.some((t) => t.place === 1))
        .slice(0, limit);
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
      const { data, error } = await client.from("event_placements").select("event_id,player_id,place,tiger_king").in("event_id", eventIds);
      check(error, "Failed to load placements");
      return (data ?? []) as { event_id: string; player_id: string; place: number | null; tiger_king: boolean }[];
    },
    async setPlacement({ eventId, playerId, place, tigerKing }) {
      // One Tiger King per event: giving it to this player takes it from whoever had it.
      if (tigerKing) {
        const { error: clearError } = await client.from("event_placements").update({ tiger_king: false }).eq("event_id", eventId).neq("player_id", playerId);
        check(clearError, "Failed to update Tiger King");
      }
      const { error } = await client.from("event_placements").upsert({ event_id: eventId, player_id: playerId, place, tiger_king: tigerKing });
      check(error, "Failed to save placement");
    },
    async replaceForEvent(eventId, rows) {
      const { error } = await client.from("event_placements").upsert(rows.map((r) => ({ event_id: eventId, player_id: r.playerId, place: r.place, tiger_king: r.tigerKing })));
      check(error, "Failed to save results");
      const keep = rows.map((r) => r.playerId).join(",");
      const { error: removeError } = await client.from("event_placements").delete().eq("event_id", eventId).not("player_id", "in", `(${keep})`);
      check(removeError, "Failed to save results");
    },
    async removePlacement(eventId, playerId) {
      const { error } = await client.from("event_placements").delete().eq("event_id", eventId).eq("player_id", playerId);
      check(error, "Failed to remove placement");
    },
  };
}

/** Results for public pages. Nothing without Supabase. */
export function publicResults(): Pick<ResultsRepository, "recentPodiums" | "placementsForPlayer"> {
  return hasSupabase() ? supabaseResults(createPublicClient()) : { recentPodiums: async () => [], placementsForPlayer: async () => [] };
}
