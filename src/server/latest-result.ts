import "server-only";
import { eventUsesBomLogo } from "@/domain/event";
import type { Tier } from "@/domain/tier";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { eventPoints } from "@/domain/standings";
import { publicResults } from "./results";
import { publicPointsTable } from "./settings";

export type LatestResult = {
  title: string; tier: Tier; date: string;
  logo: { src: string; alt: string };
  top: { place: number; name: string; bomId: string; tigerKing: boolean; points: number }[];
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

/** The last events that have a champion recorded, newest first, each with its top eight. Cup and above show the BOM logo, Ranked its sub community's. */
export async function latestResults(now: Date, limit = 2): Promise<LatestResult[]> {
  const [podiums, table] = await Promise.all([publicResults().recentPodiums(now.toISOString(), limit), publicPointsTable()]);
  return podiums.map((p) => {
    const tier = p.tier as Tier;
    const bom = eventUsesBomLogo(tier) || !p.communityLogo;
    return {
      title: p.name, tier, date: dateFmt.format(new Date(p.startsAt)),
      top: p.top.map((t) => ({ ...t, points: eventPoints(table, p.tier, { place: t.place, tigerKing: t.tigerKing }, p.participants) })),
      logo: bom ? { src: BOM_LOGO, alt: "BOM" } : { src: mediaUrl(p.communityLogo!), alt: p.communityName ?? "" },
    };
  });
}
