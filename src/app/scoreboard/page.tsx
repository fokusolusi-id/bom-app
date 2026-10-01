import { createClient, hasSupabase } from "@/lib/supabase/server";
import { mockMatch, type Match } from "@/lib/data";
import { LiveBoard } from "./live-board";

export const metadata = { title: "Scoreboard | BOM" };
export const dynamic = "force-dynamic";

async function getLive(): Promise<Match | null> {
  if (!hasSupabase()) return mockMatch;
  const supabase = await createClient();
  const { data } = await supabase.from("matches").select("*").eq("status", "live").order("updated_at", { ascending: false }).limit(1);
  return (data?.[0] as Match) ?? null;
}

export default async function ScoreboardPage() {
  const initial = await getLive();
  return (
    <main className="mx-auto flex min-h-[calc(100vh-61px)] max-w-[1920px] flex-col gap-8 p-10">
      <LiveBoard initial={initial} />
    </main>
  );
}
