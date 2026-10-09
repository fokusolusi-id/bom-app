import { redirect } from "next/navigation";

// Moved: this is now part of /admin/competition.
export default function AdminScheduleRedirect() {
  redirect("/admin/competition#schedule");
}
