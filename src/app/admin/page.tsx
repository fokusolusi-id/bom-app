import { redirect } from "next/navigation";

// Moved: this is now part of /admin/home.
export default function AdminIndex() {
  redirect("/admin/home");
}
