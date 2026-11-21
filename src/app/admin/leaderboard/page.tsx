import { AdminSectionsPage } from "@/components/admin/admin-page";
import { requireStaff } from "@/server/admin-session";
import { PointsSection } from "./points-section";
import { ResultsSection } from "./results-section";

export const metadata = { title: "Leaderboard | Admin Beyblade of Medan" };

/** What drives the public leaderboard: who took part in each event, and the points table (admins only). */
export default async function AdminLeaderboardPage() {
  const { isAdmin } = await requireStaff();
  const sections = isAdmin ? ([["results", "Results"], ["points", "Points"]] as const) : ([["results", "Events"]] as const);
  return (
    <AdminSectionsPage title={isAdmin ? "Leaderboard" : "Check-in"} hint={isAdmin ? "Event results and the points table." : "See who checked in at each tournament."} sections={sections}>
      <ResultsSection />
      {isAdmin && <PointsSection />}
    </AdminSectionsPage>
  );
}
