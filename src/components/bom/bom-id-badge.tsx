import { Badge } from "@/components/ui/badge";
import { formatBomId } from "@/domain/profile";
import { cn } from "@/lib/utils";

/** The one way a BOM ID is shown: "[BOM-001]" on an orange chip. */
export function BomIdBadge({ id, className }: { id: string; className?: string }) {
  return <Badge className={cn("text-primary-foreground", className)}>{formatBomId(id)}</Badge>;
}
