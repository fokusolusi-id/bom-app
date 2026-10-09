import { redirect } from "next/navigation";

// Moved: this is now part of /admin/members.
export default function AdminSignupsRedirect() {
  redirect("/admin/members#sign-ups");
}
