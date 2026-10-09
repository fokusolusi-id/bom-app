import { AdminSectionsPage } from "@/components/admin/admin-page";
import { ScheduleSection } from "./schedule-section";
import { PointsSection } from "./points-section";
import { ResultsSection } from "./results-section";

export const metadata = { title: "Competition | Admin BOM" };

const sections = [["schedule", "Schedule"], ["results", "Results"], ["points", "Points"]] as const;

/** Running the competition: the calendar, event results and the points table. `?c=` filters the schedule by community. */
export default async function AdminCompetitionPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return (
    <AdminSectionsPage title="Competition" hint="The calendar, event results and the points table." sections={sections}>
      <ScheduleSection community={c} />
      <ResultsSection />
      <PointsSection />
    </AdminSectionsPage>
  );
}
