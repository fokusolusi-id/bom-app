import { redirect } from "next/navigation";

// Moved: this is now part of /admin/about.
export default function AdminCommunitiesRedirect() {
  redirect("/admin/about#sub-communities");
}
