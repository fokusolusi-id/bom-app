import { ScheduleView } from "./schedule-view";

export const metadata = { title: "Schedule | Admin BOM" };

/** The calendar of gatherings and competitions. `?c=` filters it by community, `?t=` by competition type. */
export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const { c, t } = await searchParams;
  return <ScheduleView community={c} type={t} />;
}
