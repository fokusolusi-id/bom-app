import "server-only";
import { outcome } from "@/domain/scoring";
import type { Match } from "@/domain/types";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";
import { publicTournaments } from "./tournaments";

export type LatestResult = { title: string; champion: string; runnerUp: string | null; note: string };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

/** Podium of the last tournament with a champion, else the last decided finished match. */
export async function latestResult(today: string): Promise<LatestResult | null> {
  const podium = await publicTournaments().latestPodium(today);
  if (podium) {
    return { title: podium.name, champion: podium.champion, runnerUp: podium.runnerUp, note: `BOM ${podium.tier} · ${dateFmt.format(new Date(`${podium.held_on}T00:00:00+07:00`))}` };
  }
  if (!hasSupabase()) return null;
  const { data, error } = await createPublicClient().from("matches").select("*").eq("status", "finished").order("updated_at", { ascending: false }).limit(10);
  check(error, "Failed to load latest match");
  for (const m of (data ?? []) as Match[]) {
    const o = outcome(m.a_score, m.b_score);
    if (o === "draw") continue;
    const aWon = o === "a";
    return {
      title: `BOM ${m.tier} · ${m.round}`,
      champion: aWon ? m.a_name : m.b_name,
      runnerUp: aWon ? m.b_name : m.a_name,
      note: `${Math.max(m.a_score, m.b_score)}-${Math.min(m.a_score, m.b_score)}${m.updated_at ? ` · ${dateFmt.format(new Date(m.updated_at))}` : ""}`,
    };
  }
  return null;
}
