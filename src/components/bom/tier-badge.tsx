import { Badge } from "@/components/ui/badge";
import type { TierLabel } from "@/domain/tier";
import { cn } from "@/lib/utils";
import { BombIcon, type BombLevel } from "./bomb-icon";

const styles: Record<TierLabel, { variant: "muted" | "secondary" | "outline" | "default" | "destructive"; level: BombLevel }> = {
  Unrank: { variant: "muted", level: 1 },
  Ranked: { variant: "secondary", level: 2 },
  Cup: { variant: "outline", level: 3 },
  Major: { variant: "default", level: 4 },
  Championship: { variant: "destructive", level: 5 },
};

/** Tier tag with a bomb that grows with the tier's impact. Fixed width so tags line up in lists. */
export function TierBadge({ tier, className }: { tier: TierLabel; className?: string }) {
  const { variant, level } = styles[tier];
  return (
    <Badge variant={variant} className={cn("w-48 justify-start gap-2 py-1", className)}>
      <BombIcon level={level} />
      BOM {tier}
    </Badge>
  );
}
