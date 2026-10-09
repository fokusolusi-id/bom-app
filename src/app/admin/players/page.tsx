import { redirect } from "next/navigation";

// Moved: this is now part of /admin/members.
export default function AdminPlayersRedirect() {
  redirect("/admin/members#players");
}
