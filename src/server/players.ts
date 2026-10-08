import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/domain/types";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface PlayerRepository {
  list(limit?: number): Promise<Player[]>;
  /** Case-insensitive: "bom-001" finds "BoM-001". */
  getByBomId(bomId: string): Promise<Player | null>;
  /** 1-based leaderboard position; ties share the better rank. */
  rank(points: number): Promise<number>;
}

export function supabasePlayers(client: SupabaseClient): PlayerRepository {
  return {
    async list(limit = 100) {
      const { data, error } = await client.from("players").select("*").order("points", { ascending: false }).limit(limit);
      check(error, "Failed to load players");
      return (data ?? []) as Player[];
    },
    async getByBomId(bomId) {
      // ilike treats % and _ as wildcards; ids are validated, but escape anyway.
      const pattern = bomId.replace(/[\\%_]/g, "\\$&");
      const { data, error } = await client.from("players").select("*").ilike("bom_id", pattern).maybeSingle();
      check(error, "Failed to load player");
      return (data as Player | null) ?? null;
    },
    async rank(points) {
      const { count, error } = await client.from("players").select("id", { count: "exact", head: true }).gt("points", points);
      check(error, "Failed to load rank");
      return (count ?? 0) + 1;
    },
  };
}

// Used when Supabase env vars are not set (local preview).
export const samplePlayers: Player[] = [
  { bom_id: "BOM-0001", name: "Rakha", points: 1240, wins: 31, losses: 6 },
  { bom_id: "BOM-0007", name: "Dimas", points: 1105, wins: 28, losses: 8 },
  { bom_id: "BOM-0012", name: "Fadil", points: 980, wins: 24, losses: 9 },
  { bom_id: "BOM-0003", name: "Putra", points: 915, wins: 22, losses: 11 },
];

export function memoryPlayers(players: Player[] = samplePlayers): PlayerRepository {
  return {
    list: async (limit = 100) => [...players].sort((a, b) => b.points - a.points).slice(0, limit),
    getByBomId: async (bomId) => players.find((p) => p.bom_id.toLowerCase() === bomId.toLowerCase()) ?? null,
    rank: async (points) => players.filter((p) => p.points > points).length + 1,
  };
}

export function publicPlayers(): { repo: PlayerRepository; live: boolean } {
  return hasSupabase()
    ? { repo: supabasePlayers(createPublicClient()), live: true }
    : { repo: memoryPlayers(), live: false };
}
