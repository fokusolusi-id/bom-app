import { AdminSectionsPage } from "@/components/admin/admin-page";
import { PointsSection } from "./points-section";
import { ResultsSection } from "./results-section";

export const metadata = { title: "Leaderboard | Admin BOM" };

const sections = [["results", "Results"], ["points", "Points"]] as const;

/** What drives the public leaderboard: the final places of the big events and the points table. */
export default function AdminLeaderboardPage() {
  return (
    <AdminSectionsPage title="Leaderboard" hint="Event results and the points table." sections={sections}>
      <ResultsSection />
      <PointsSection />
    </AdminSectionsPage>
  );
}
