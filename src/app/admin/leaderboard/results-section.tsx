import { AdminSection } from "@/components/admin/admin-page";
import { requireStaff } from "@/server/admin-session";
import { ResultsBrowser } from "./results-browser";
import { loadResultEvents } from "./results-data";

/** Every past event, with a filter and a pencil that opens the event's results on their own page. The events themselves are added under Schedule. */
export async function ResultsSection() {
  const { events } = await loadResultEvents(await requireStaff());
  return (
    <AdminSection id="results" title="Results" hint="Every past event, except breaks and holidays: they show up here by themselves. Filter by competition type and sub community, then open an event with the pencil to enter or correct who took part. Points are calculated from this, the number of participants and the points table. Add events under Schedule.">
      <ResultsBrowser events={events} />
    </AdminSection>
  );
}
