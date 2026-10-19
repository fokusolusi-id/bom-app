import { ArchivesView } from "./archives-view";
import { BreaksView } from "./breaks-view";
import { ScheduleView } from "./schedule-view";

export const metadata = { title: "Schedule | Admin BOM" };

/** The calendar of gatherings and competitions. `?c=` filters it by community, `?t=` by competition type; `?tab=breaks` is the breaks and holidays, `?tab=past` the Past Events tab. */
export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string; tab?: string }> }) {
  const { c, t, tab } = await searchParams;
  if (tab === "breaks") return <BreaksView />;
  if (tab === "past") return <ArchivesView community={c} />;
  return <ScheduleView community={c} type={t} />;
}
