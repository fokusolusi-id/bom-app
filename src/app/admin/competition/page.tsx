import { redirect } from "next/navigation";

// Moved: the schedule and the leaderboard tools are separate pages now.
export default function AdminCompetitionRedirect() {
  redirect("/admin/schedule");
}
