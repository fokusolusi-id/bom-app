import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatchInput } from "@/domain/match-input";
import type { Side } from "@/domain/scoring";
import type { Match } from "@/domain/types";
import { check } from "./db";

export interface MatchRepository {
  listOpen(): Promise<Match[]>;
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
