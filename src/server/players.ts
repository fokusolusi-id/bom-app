import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/domain/types";
import { createPublicClient, hasSupabase } from "./supabase-public";

export interface PlayerRepository {
  list(limit?: number): Promise<Player[]>;
}

export function supabasePlayers(client: SupabaseClient): PlayerRepository {
  return {
    async list(limit = 100) {
      const { data, error } = await client.from("players").select("*").order("points", { ascending: false }).limit(limit);
      if (error) throw new Error(`Failed to load players: ${error.message}`);
      return (data ?? []) as Player[];
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
  return { list: async (limit = 100) => [...players].sort((a, b) => b.points - a.points).slice(0, limit) };
}

export function publicPlayers(): { repo: PlayerRepository; live: boolean } {
  return hasSupabase()
    ? { repo: supabasePlayers(createPublicClient()), live: true }
    : { repo: memoryPlayers(), live: false };
}
