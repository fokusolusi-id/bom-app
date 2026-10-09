import { redirect } from "next/navigation";

// Moved: this is now part of /admin/about.
export default function AdminTeamRedirect() {
  redirect("/admin/about#team");
}
