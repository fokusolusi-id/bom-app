import { redirect } from "next/navigation";

// Moved: sponsors are now part of Home.
export default function AdminSponsorRedirect() {
  redirect("/admin/home#sponsors");
}
