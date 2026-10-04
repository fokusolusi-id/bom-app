"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid, parseMatchInput } from "@/domain/match-input";
import { outcome, pointsFor, type Side } from "@/domain/scoring";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin-session";
import { supabaseMatches } from "@/server/matches";
import { supabasePlayers } from "@/server/players";

export async function createMatch(formData: FormData) {
  const supabase = await requireAdmin();
  const input = parseMatchInput((k) => formData.get(k));
  const players = await supabasePlayers(supabase).list(1000);
  const a = players.find((p) => p.id === input.aId);
  const b = players.find((p) => p.id === input.bId);
  if (!a || !b) throw new Error("Blader tidak ditemukan");
  await supabaseMatches(supabase).create(input, { a: a.name, b: b.name });
  revalidatePath("/admin");
}

export async function bumpScore(id: string, side: Side, delta: 1 | -1) {
  if (!isUuid(id) || (side !== "a" && side !== "b") || (delta !== 1 && delta !== -1)) throw new Error("Invalid input");
  const supabase = await requireAdmin();
  await supabaseMatches(supabase).bump(id, side, delta);
  revalidatePath("/admin");
}

export async function finishMatch(id: string) {
  if (!isUuid(id)) throw new Error("Invalid input");
  const supabase = await requireAdmin();
  const repo = supabaseMatches(supabase);
  const match = await repo.get(id);
  if (!match || match.status === "finished") return;
  const result = outcome(match.a_score, match.b_score);
  const pts = result === "draw" ? { winner: 0, loser: 0 } : pointsFor(match.tier);
  await repo.finish(id, pts.winner, pts.loser);
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
