import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlacementInput, TournamentInput } from "@/domain/tournament";
import type { PlacementRow, Tournament } from "@/domain/types";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export type TournamentWithPlacements = Tournament & { placements: { player_id: string; place: number }[] };

export type Podium = { name: string; tier: Tournament["tier"]; held_on: string; champion: string; runnerUp: string | null };

export interface TournamentRepository {
  /** Soonest tournament on or after `today` (YYYY-MM-DD, WIB), or null. */
  upcoming(today: string): Promise<Tournament | null>;
  /** Most recent tournament on or before `today` that has a champion recorded. */
  latestPodium(today: string): Promise<Podium | null>;
  list(): Promise<TournamentWithPlacements[]>;
  placementsForPlayer(playerId: string): Promise<PlacementRow[]>;
  save(input: TournamentInput): Promise<void>;
  remove(id: string): Promise<void>;
  setPlacement(input: PlacementInput): Promise<void>;
  removePlacement(tournamentId: string, playerId: string): Promise<void>;
}

export function supabaseTournaments(client: SupabaseClient): TournamentRepository {
  return {
    async upcoming(today) {
      const { data, error } = await client.from("tournaments").select("id,name,tier,held_on").gte("held_on", today).order("held_on").limit(1);
      check(error, "Failed to load next tournament");
      return ((data ?? [])[0] as Tournament | undefined) ?? null;
    },
    async latestPodium(today) {
      const { data, error } = await client
        .from("tournaments")
        .select("name,tier,held_on,placements(place,player:players(name))")
        .lte("held_on", today)
        .order("held_on", { ascending: false })
        .limit(10);
      check(error, "Failed to load latest result");
      type Row = Tournament & { placements: { place: number; player: { name: string } | null }[] };
      for (const t of (data ?? []) as unknown as Row[]) {
        const name = (place: number) => t.placements.find((p) => p.place === place)?.player?.name ?? null;
        const champion = name(1);
        if (champion) return { name: t.name, tier: t.tier, held_on: t.held_on, champion, runnerUp: name(2) };
      }
      return null;
    },
    async list() {
      const { data, error } = await client.from("tournaments").select("id,name,tier,held_on,placements(player_id,place)").order("held_on", { ascending: false });
      check(error, "Failed to load tournaments");
      return (data ?? []) as TournamentWithPlacements[];
    },
    async placementsForPlayer(playerId) {
      const { data, error } = await client.from("placements").select("place,tournament:tournaments(id,name,tier,held_on)").eq("player_id", playerId);
      check(error, "Failed to load placements");
      const rows = (data ?? []) as unknown as PlacementRow[];
      return rows.sort((a, b) => b.tournament.held_on.localeCompare(a.tournament.held_on));
    },
    async save(input) {
      const { id, ...row } = input;
      const { error } = id ? await client.from("tournaments").update(row).eq("id", id) : await client.from("tournaments").insert(row);
      check(error, "Failed to save tournament");
    },
    async remove(id) {
      const { error } = await client.from("tournaments").delete().eq("id", id);
      check(error, "Failed to delete tournament");
    },
    async setPlacement({ tournamentId, playerId, place }) {
      const { error } = await client.from("placements").upsert({ tournament_id: tournamentId, player_id: playerId, place });
      check(error, "Failed to save placement");
    },
    async removePlacement(tournamentId, playerId) {
      const { error } = await client.from("placements").delete().eq("tournament_id", tournamentId).eq("player_id", playerId);
      check(error, "Failed to remove placement");
    },
  };
}

/** Placements for public pages. Empty without Supabase. */
export function publicPlacements(): Pick<TournamentRepository, "placementsForPlayer"> {
  return hasSupabase() ? supabaseTournaments(createPublicClient()) : { placementsForPlayer: async () => [] };
}

/** Tournament lookups for public pages. Nothing without Supabase. */
export function publicTournaments(): Pick<TournamentRepository, "upcoming" | "latestPodium"> {
  return hasSupabase() ? supabaseTournaments(createPublicClient()) : { upcoming: async () => null, latestPodium: async () => null };
}
