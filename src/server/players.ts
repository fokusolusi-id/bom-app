import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlayerInput } from "@/domain/player-input";
import type { Player, PlayerStatus } from "@/domain/types";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface PlayerRepository {
  /** Active players by points. Admin screens pass `includeRegistered` to also pick not-yet-active members. */
  list(limit?: number, opts?: { includeRegistered?: boolean }): Promise<Player[]>;
  setStatus(playerId: string, status: PlayerStatus): Promise<void>;
  /** Admin edit of a player's name, BOM ID and status. Their record is never touched here. */
  update(input: PlayerInput): Promise<void>;
  /** Case-insensitive: "bom-001" finds "BoM-001". */
  getByBomId(bomId: string): Promise<Player | null>;
  /** 1-based leaderboard position; ties share the better rank. */
  rank(points: number): Promise<number>;
  /** Sets or clears the member photo (a media bucket path). Returns the previous path so the caller can delete the file. */
  setPhoto(playerId: string, path: string | null): Promise<string | null>;
}

export function supabasePlayers(client: SupabaseClient): PlayerRepository {
  return {
    async list(limit = 100, opts) {
      let q = client.from("players").select("*").order("points", { ascending: false }).limit(limit);
      if (!opts?.includeRegistered) q = q.eq("status", "active");
      const { data, error } = await q;
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
      const { count, error } = await client.from("players").select("id", { count: "exact", head: true }).eq("status", "active").gt("points", points);
      check(error, "Failed to load rank");
      return (count ?? 0) + 1;
    },
    async setPhoto(playerId, path) {
      const { data, error: readError } = await client.from("players").select("photo_path").eq("id", playerId).maybeSingle();
      check(readError, "Failed to load player");
      const { error } = await client.from("players").update({ photo_path: path }).eq("id", playerId);
      check(error, "Failed to update player photo");
      return (data as { photo_path: string | null } | null)?.photo_path ?? null;
    },
    async update({ id, ...row }) {
      const { error } = await client.from("players").update(row).eq("id", id);
      check(error, "Failed to update player");
    },
    async setStatus(playerId, status) {
      const { error } = await client.from("players").update({ status }).eq("id", playerId);
      check(error, "Failed to update player status");
    },
  };
}

// Used when Supabase env vars are not set (local preview).
export const samplePlayers: Player[] = [
  { bom_id: "BOM-0001", name: "Rakha", points: 1240 },
  { bom_id: "BOM-0007", name: "Dimas", points: 1105 },
  { bom_id: "BOM-0012", name: "Fadil", points: 980 },
  { bom_id: "BOM-0003", name: "Putra", points: 915 },
];

export function memoryPlayers(players: Player[] = samplePlayers): PlayerRepository {
  return {
    setStatus: async () => {},
    update: async () => {},
    setPhoto: async () => null,
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
