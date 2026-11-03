import { Crown, ExternalLink, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardPodium } from "@/components/ui/leaderboard-podium";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import type { LatestResult } from "@/server/latest-result";

/**
 * One event's result: its logo and level, the winning stair, the champion's combos and the top eight with their combos. The four rows
 * (header, podium, list, bracket link) are rows of the parent grid, so cards side by side line up. `latest` marks the newest one.
 */
export function ResultCard({ r, latest }: { r: LatestResult; latest?: boolean }) {
  return (
    <Card className={`h-full md:row-span-4 md:grid md:grid-rows-subgrid border-2 ${latest ? "border-primary" : ""}`}>
      <CardContent className="space-y-4 md:row-span-4 md:grid md:grid-rows-subgrid md:space-y-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <Image src={r.logo.src} alt={r.logo.alt} width={96} height={96} className="size-16 object-contain" />
            <TierTile tier={r.tier} className="size-14" />
          </div>
          <div className="min-w-0">
            <div className={`font-label text-lg font-bold tracking-[0.08em] uppercase italic ${TIER_TILE[r.tier].title}`}>{EVENT_TYPE_LABEL(r.tier)}{latest && <span className="text-primary ml-2 text-xs not-italic">Latest</span>}</div>
            <div className="font-display text-xl leading-tight font-extrabold italic">{r.title}</div>
            <p className="text-muted-foreground text-sm">{r.date}{r.tier === "Unrank" ? " · no points" : " · points earned that week"}</p>
          </div>
        </div>
        {/* The winning stair: the top three, then everyone in the top eight below. */}
        <LeaderboardPodium rankings={r.top.filter((t) => t.place <= 3).map((t) => ({ rank: t.place, name: t.name, bomId: t.bomId, value: r.tier === "Unrank" ? undefined : t.points, tigerKing: t.tigerKing }))} />
        <div className="space-y-4">
          {r.top[0]?.combos.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1.5 text-xs uppercase">Winning combos of {r.top[0].name}</div>
              <ul className="flex flex-wrap gap-1.5">
                {r.top[0].combos.map((c) => <li key={c} className="bg-primary/15 text-primary rounded-md border border-primary/40 px-2 py-1 font-mono text-xs font-bold">{c}</li>)}
              </ul>
            </div>
          )}
          <ol className="space-y-1.5">
            {r.top.map((t) => (
              <li key={`${t.place}-${t.name}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="font-num text-primary w-6 text-center text-lg font-black italic">{t.place}</span>
                {t.bomId ? (
                  <>
                    <Link href={`/member/${t.bomId.toLowerCase()}`} aria-label={`Profile ${t.name}`}><BomIdBadge id={t.bomId} className="transition-colors hover:bg-white" /></Link>
                    <Link href={`/member/${t.bomId.toLowerCase()}`} className={`hover:text-primary ${t.place === 1 ? "font-bold" : ""}`}>{t.name}</Link>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground rounded border px-1.5 py-0.5 text-xs uppercase">Non BOM ID</span>
                    <span className={t.place === 1 ? "font-bold" : ""}>{t.name}</span>
                  </>
                )}
                {t.tigerKing && <Crown className="size-4 text-red-500" aria-label="Tiger King" />}
                {t.place <= 3 && <Trophy className={`size-4 ${t.place === 1 ? "text-yellow-400" : t.place === 2 ? "text-neutral-300" : "text-amber-600"}`} aria-label={`Place ${t.place}`} />}
                {t.bomId && r.tier !== "Unrank" && <span className="font-num tabular text-muted-foreground ml-auto text-sm">+{t.points} pts</span>}
                {t.combos.length > 0 && <span className="text-muted-foreground basis-full pl-9 font-mono text-xs">{t.combos.join(" · ")}</span>}
              </li>
            ))}
          </ol>
        </div>
        {r.challongeUrl && <a href={r.challongeUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 text-sm underline">View the bracket on Challonge<ExternalLink className="size-3.5" aria-hidden /></a>}
      </CardContent>
    </Card>
  );
}
