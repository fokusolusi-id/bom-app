import { redirect } from "next/navigation";

// Moved: this is now /admin/leaderboard#results.
export default function AdminTournamentsRedirect() {
  redirect("/admin/leaderboard#results");
}
