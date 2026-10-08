import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchInput } from "@/domain/match-input";
import type { Side } from "@/domain/scoring";
import type { Match } from "@/domain/types";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface MatchRepository {
  listOpen(): Promise<Match[]>;
  listFinishedForPlayer(playerId: string): Promise<Match[]>;
  get(id: string): Promise<Match | null>;
  create(input: MatchInput, names: { a: string; b: string }): Promise<void>;
  bump(id: string, side: Side, delta: 1 | -1): Promise<void>;
  finish(id: string, winnerPoints: number, loserPoints: number): Promise<void>;
}

export function supabaseMatches(client: SupabaseClient): MatchRepository {
  return {
    async listOpen() {
      const { data, error } = await client.from("matches").select("*").neq("status", "finished").order("created_at", { ascending: false });
      check(error, "Failed to load matches");
      return (data ?? []) as Match[];
    },
    async listFinishedForPlayer(playerId) {
      const { data, error } = await client.from("matches").select("*").eq("status", "finished")
        .or(`a_id.eq.${playerId},b_id.eq.${playerId}`).order("updated_at", { ascending: false }).limit(200);
      check(error, "Failed to load match history");
      return (data ?? []) as Match[];
    },
    async get(id) {
      const { data, error } = await client.from("matches").select("*").eq("id", id).maybeSingle();
      check(error, "Failed to load match");
      return (data as Match | null) ?? null;
    },
    async create(input, names) {
      const { error } = await client.from("matches").insert({
        tier: input.tier, round: input.round, stadium: input.stadium, target: input.target,
        a_id: input.aId, b_id: input.bId, a_name: names.a, b_name: names.b, status: "live",
      });
      check(error, "Failed to create match");
    },
    async bump(id, side, delta) {
      const { error } = await client.rpc("bump_score", { p_match: id, p_side: side, p_delta: delta });
      check(error, "Failed to update score");
    },
    async finish(id, winnerPoints, loserPoints) {
      const { error } = await client.rpc("finish_match", { match_id: id, win_points: winnerPoints, lose_points: loserPoints });
      check(error, "Failed to finish match");
    },
  };
}

/** Finished-match history for public pages. Empty without Supabase (preview has no matches). */
export function publicMatchHistory(): Pick<MatchRepository, "listFinishedForPlayer"> {
  return hasSupabase() ? supabaseMatches(createPublicClient()) : { listFinishedForPlayer: async () => [] };
}
