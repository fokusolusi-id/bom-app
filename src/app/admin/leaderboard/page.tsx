import { AdminSectionsPage } from "@/components/admin/admin-page";
import { requireStaff } from "@/server/admin-session";
import { PointsSection } from "./points-section";
import { ResultsSection } from "./results-section";

export const metadata = { title: "Leaderboard | Admin BOM" };

/** What drives the public leaderboard: who took part in each event, and the points table (admins only). */
export default async function AdminLeaderboardPage() {
  const { isAdmin } = await requireStaff();
  const sections = isAdmin ? ([["results", "Results"], ["points", "Points"]] as const) : ([["results", "Results"]] as const);
  return (
    <AdminSectionsPage title={isAdmin ? "Leaderboard" : "Results"} hint={isAdmin ? "Event results and the points table." : "Enter the results of your sub community's Ranked events."} sections={sections}>
      <ResultsSection />
      {isAdmin && <PointsSection />}
    </AdminSectionsPage>
  );
}
