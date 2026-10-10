import type { Tier } from "./tier";

export type PlayerStatus = "registered" | "active";
export const PLAYER_ROLES = [["member", "Member"], ["organizer", "Organizer"], ["admin", "Admin"]] as const;
export type PlayerRole = (typeof PLAYER_ROLES)[number][0];

/** Registered players have a BOM ID but stay off the leaderboard until an admin activates them. */
/** What the membership form collected. Never loaded for the public: only admins can read these columns. */
export type PlayerContact = {
  full_name: string | null; whatsapp: string | null; address: string | null; age_group: string | null;
  guardian_name: string | null; guardian_whatsapp: string | null; hear_from: string | null; photo_consent: boolean;
  payment_proof_path: string | null; payment_proof_url?: string | null;
};
export type Player = { id?: string; bom_id: string; name: string; points: number; status?: PlayerStatus; role?: PlayerRole; contact?: PlayerContact; photo_path?: string | null; created_at?: string };

/** A player's final place at an event (Cup, Major or Championship), joined with the event. */
export type PlacementRow = { place: number | null; event: { id: string; name: string; tier: Tier; starts_at: string } };
