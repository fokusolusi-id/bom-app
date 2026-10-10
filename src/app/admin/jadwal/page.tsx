import { redirect } from "next/navigation";

// Moved: this is now /admin/schedule.
export default function AdminScheduleRedirect() {
  redirect("/admin/schedule");
}
