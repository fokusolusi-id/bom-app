import "server-only";
import { publicResults } from "./results";

export type LatestResult = { title: string; champion: string; runnerUp: string | null; note: string };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

/** Podium of the last Cup, Major or Championship that has a champion recorded, if any. */
export async function latestResult(now: Date): Promise<LatestResult | null> {
  const podium = await publicResults().latestPodium(now.toISOString());
  if (!podium) return null;
  return { title: podium.name, champion: podium.champion, runnerUp: podium.runnerUp, note: `BOM ${podium.tier} · ${dateFmt.format(new Date(podium.startsAt))}` };
}
