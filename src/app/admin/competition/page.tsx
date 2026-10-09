import { AdminSectionsPage } from "@/components/admin/admin-page";
import { MatchesSection } from "./matches-section";
import { ScheduleSection } from "./schedule-section";
import { ResultsSection } from "./results-section";

export const metadata = { title: "Competition | Admin BOM" };

const sections = [["schedule", "Schedule"], ["results", "Results"], ["matches", "Matches"]] as const;

/** Running the competition: the calendar, event results and live matches. `?c=` filters the schedule by community. */
export default async function AdminCompetitionPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return (
    <AdminSectionsPage title="Competition" hint="The calendar, event results and live matches." sections={sections}>
      <ScheduleSection community={c} />
      <ResultsSection />
      <MatchesSection />
    </AdminSectionsPage>
  );
}
