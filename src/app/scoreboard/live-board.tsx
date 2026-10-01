"use client";
import { useEffect, useState } from "react";
import { ScoreTile } from "@/components/bom/score-tile";
import { TierBadge } from "@/components/bom/tier-badge";
import { createClient, hasSupabase } from "@/lib/supabase/client";
import type { Match } from "@/lib/data";

export function LiveBoard({ initial }: { initial: Match | null }) {
  const [m, setM] = useState<Match | null>(initial);

  useEffect(() => {
    if (!hasSupabase()) return;
    const supabase = createClient();
    const channel = supabase
      .channel("matches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, async (payload) => {
        const row = payload.new as Match | undefined;
        if (row && row.status === "live") setM(row);
        else if (!row || (m && row.id === m.id)) {
          const { data } = await supabase.from("matches").select("*").eq("status", "live").order("updated_at", { ascending: false }).limit(1);
          setM((data?.[0] as Match) ?? null);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [m]);

  if (!m) {
    return <div className="font-display text-muted-foreground flex flex-1 items-center justify-center text-6xl font-black italic uppercase">Menunggu match berikutnya</div>;
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <TierBadge tier={m.tier} />
          <span className="font-display text-4xl font-extrabold italic uppercase">{m.round}</span>
        </div>
        <span className="text-muted-foreground font-display text-3xl font-bold italic uppercase">{m.stadium} &middot; First to {m.target}</span>
      </div>
      <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-stretch gap-8">
        <ScoreTile tv name={m.a_name} score={m.a_score} combo={m.a_combo ?? undefined} leading={m.a_score > m.b_score} />
        <div className="font-display text-primary flex items-center text-7xl font-black italic">VS</div>
        <ScoreTile tv name={m.b_name} score={m.b_score} combo={m.b_combo ?? undefined} leading={m.b_score > m.a_score} />
      </div>
    </>
  );
}
