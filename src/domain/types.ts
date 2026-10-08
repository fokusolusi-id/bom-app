import type { Tier } from "./tier";

export type MatchStatus = "scheduled" | "live" | "finished";

export type Player = { id?: string; bom_id: string; name: string; points: number; wins: number; losses: number };

export type Match = {
  id: string; tier: Tier; round: string; stadium: string; target: number;
  a_id: string | null; b_id: string | null;
  a_name: string; b_name: string; a_score: number; b_score: number;
  a_combo?: string | null; b_combo?: string | null; updated_at?: string;
  status: MatchStatus;
};

export type Tournament = { id?: string; name: string; tier: Tier; held_on: string };

/** A player's final place at a tournament, joined with the tournament. */
export type PlacementRow = { place: number; tournament: Tournament };
