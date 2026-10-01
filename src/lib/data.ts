export type Tier = "Ranked" | "Cup" | "Major" | "Championship";

export type Player = { id?: string; bom_id: string; name: string; points: number; wins: number; losses: number };
export type Match = {
  id: string; tier: Tier; round: string; stadium: string; target: number;
  a_name: string; b_name: string; a_score: number; b_score: number;
  a_combo: string | null; b_combo: string | null; status: "scheduled" | "live" | "finished";
};

// Fallback data when Supabase env vars are not set (local preview).
export const mockPlayers: Player[] = [
  { bom_id: "BOM-0001", name: "Rakha", points: 1240, wins: 31, losses: 6 },
  { bom_id: "BOM-0007", name: "Dimas", points: 1105, wins: 28, losses: 8 },
  { bom_id: "BOM-0012", name: "Fadil", points: 980, wins: 24, losses: 9 },
  { bom_id: "BOM-0003", name: "Putra", points: 915, wins: 22, losses: 11 },
];
export const mockMatch: Match = {
  id: "mock", tier: "Ranked", round: "Semifinal", stadium: "Stadium 1", target: 4,
  a_name: "Rakha", b_name: "Fadil", a_score: 2, b_score: 1,
  a_combo: "Dran Sword 3-60 F", b_combo: "Wizard Rod 5-70 DB", status: "live",
};
