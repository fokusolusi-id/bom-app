import { redirect } from "next/navigation";

// Moved: the slider and gallery are now part of Home.
export default function AdminMediaRedirect() {
  redirect("/admin/home#slider");
}
