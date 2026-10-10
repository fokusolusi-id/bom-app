import type { Tier } from "./tier";

export type PlayerStatus = "registered" | "active";

/** Registered players have a BOM ID but stay off the leaderboard until an admin activates them. */
export type Player = { id?: string; bom_id: string; name: string; points: number; status?: PlayerStatus; photo_path?: string | null; created_at?: string };

/** A player's final place at an event (Cup, Major or Championship), joined with the event. */
export type PlacementRow = { place: number | null; event: { id: string; name: string; tier: Tier; starts_at: string } };
