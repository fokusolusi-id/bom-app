import { ArrowRight } from "lucide-react";
import { competitionPath } from "@/lib/content";
import { TierBadge } from "./tier-badge";

/** Ranked → Cup → Major → Championship, each with its bomb badge. Stacks on mobile. */
export function CompetitionPath({ showDescriptions = false }: { showDescriptions?: boolean }) {
  return (
    <ol className="flex flex-col items-start gap-4 md:flex-row md:items-start md:gap-3">
      {competitionPath.map(([tier, freq, desc], i) => (
        <li key={tier} className="flex items-start gap-3">
          {i > 0 && <ArrowRight className="text-primary mt-1.5 hidden size-5 shrink-0 md:block" aria-hidden />}
          <div className="flex w-48 flex-col gap-1">
            <TierBadge tier={tier} />
            <span className="text-muted-foreground text-xs uppercase">{freq}</span>
            {showDescriptions && <p className="text-muted-foreground text-sm normal-case">{desc}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
