"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMatchInput } from "@/domain/match-input";
import { pointsFor, type Side } from "@/domain/scoring";
import { isUuid } from "@/domain/validation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin-session";
import { supabaseMatches } from "@/server/matches";
import { supabasePlayers } from "@/server/players";
import { toFormState, type FormState } from "@/lib/form-state";

export async function createMatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parseMatchInput((k) => formData.get(k));
    const players = await supabasePlayers(supabase).list(1000, { includeRegistered: true });
    const a = players.find((p) => p.id === input.aId);
    const b = players.find((p) => p.id === input.bId);
    if (!a || !b) throw new Error("Blader not found");
    await supabaseMatches(supabase).create(input, { a: a.name, b: b.name });
    revalidatePath("/admin");
  });
}

export async function bumpScore(id: string, side: Side, delta: 1 | -1): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id) || (side !== "a" && side !== "b") || (delta !== 1 && delta !== -1)) throw new Error("Invalid input");
    await supabaseMatches(supabase).bump(id, side, delta);
    revalidatePath("/admin");
  });
}

export async function finishMatch(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    const repo = supabaseMatches(supabase);
    const match = await repo.get(id);
    if (!match || match.status === "finished") return;
    // finish_match picks the winner under a row lock and awards nothing on a draw.
    const pts = pointsFor(match.tier);
    await repo.finish(id, pts.winner, pts.loser);
    revalidatePath("/admin");
    revalidatePath("/leaderboard");
  });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
