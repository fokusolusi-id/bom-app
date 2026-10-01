"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createMatch(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("matches").insert({
    tier: String(formData.get("tier") || "Ranked"),
    round: String(formData.get("round") || "Round 1"),
    stadium: String(formData.get("stadium") || "Stadium 1"),
    target: Number(formData.get("target") || 4),
    a_name: String(formData.get("a_name")),
    b_name: String(formData.get("b_name")),
    status: "live",
  });
  revalidatePath("/admin");
}

export async function bumpScore(id: string, side: "a" | "b", delta: 1 | -1) {
  const supabase = await createClient();
  const col = side === "a" ? "a_score" : "b_score";
  const { data } = await supabase.from("matches").select(col).eq("id", id).single();
  const cur = (data as unknown as Record<string, number>)?.[col] ?? 0;
  await supabase.from("matches").update({ [col]: Math.max(0, cur + delta) }).eq("id", id);
  revalidatePath("/admin");
}

export async function finishMatch(id: string) {
  const supabase = await createClient();
  await supabase.rpc("finish_match", { match_id: id });
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
