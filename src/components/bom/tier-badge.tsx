import { Badge } from "@/components/ui/badge";
import type { Tier } from "@/domain/tier";

const styles: Record<Tier, "secondary" | "outline" | "default" | "destructive"> = {
  Ranked: "secondary",
  Cup: "outline",
  Major: "default",
  Championship: "destructive",
};
export function TierBadge({ tier }: { tier: Tier }) {
  return <Badge variant={styles[tier]}>{tier}</Badge>;
}
