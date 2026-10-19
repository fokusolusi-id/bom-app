import { Crown, Trophy } from "lucide-react"
import Link from "next/link"

import { BomIdBadge } from "@/components/bom/bom-id-badge"
import { cn } from "@/lib/utils"

interface LeaderboardPodiumRanking {
  /** Finishing place, 1 to 3. Two entries can share a place. */
  rank: number
  name: string
  /** A member's BOM ID, or null for a guest without one (Non BOM ID). */
  bomId: string | null
  value?: number
  tigerKing?: boolean
}

interface LeaderboardPodiumProps extends React.HTMLAttributes<HTMLDivElement> {
  rankings: LeaderboardPodiumRanking[]
  /** What `value` counts, shown after the number. */
  valueLabel?: string
}

// Second place on the left, first in the middle, third on the right, each step as high as its place.
// The trophy takes the colour of the medal: gold, silver, bronze.
const STEPS = [
  { rank: 2, height: "h-20", tone: "bg-neutral-500/30 border-neutral-400 text-neutral-200", trophy: "text-neutral-300" },
  { rank: 1, height: "h-28", tone: "bg-primary/25 border-primary text-primary", trophy: "text-yellow-400" },
  { rank: 3, height: "h-14", tone: "bg-amber-700/30 border-amber-600 text-amber-500", trophy: "text-amber-600" },
] as const

/** The winning stair: the top three of an event on a podium. Steps with nobody on them stay empty. */
function LeaderboardPodium({ rankings, valueLabel = "pts", className, ...props }: LeaderboardPodiumProps) {
  return (
    <div className={cn("grid grid-cols-3 grid-rows-[1fr] items-end gap-2", className)} role="group" aria-label="Winners" {...props}>
      {STEPS.map((step) => {
        const people = rankings.filter((r) => r.rank === step.rank)
        return (
          <div key={step.rank} className="flex min-w-0 flex-col items-center gap-1 text-center">
            <div className="flex min-h-14 flex-col items-center justify-end gap-1">
              {people.length > 0 && <Trophy className={cn("size-6", step.trophy)} aria-label={`Place ${step.rank}`} />}
              {people.map((p, i) => (
                <div key={`${p.name}-${i}`} className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
                  <span className="flex max-w-full items-center gap-1 text-sm font-bold">
                    <span className="truncate">{p.name}</span>
                    {p.tigerKing && <Crown className="size-3.5 shrink-0 text-red-500" aria-label="Tiger King" />}
                  </span>
                  {p.bomId ? (
                    <Link href={`/member/${p.bomId.toLowerCase()}`} aria-label={`Profile ${p.name}`}><BomIdBadge id={p.bomId} className="text-[0.65rem] transition-colors hover:bg-white" /></Link>
                  ) : (
                    <span className="text-muted-foreground rounded border px-1 text-[0.6rem] uppercase">Non BOM ID</span>
                  )}
                  {p.value !== undefined && p.bomId && <span className="font-num tabular text-muted-foreground text-xs">+{p.value} {valueLabel}</span>}
                </div>
              ))}
            </div>
            <div className={cn("font-num flex w-full items-start justify-center rounded-t-md border-x border-t pt-1 text-2xl font-black italic", step.height, step.tone)}>
              {step.rank}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { LeaderboardPodium }
export type { LeaderboardPodiumProps, LeaderboardPodiumRanking }
