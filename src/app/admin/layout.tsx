import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProfileMenu } from "@/components/admin/profile-menu";
import { requireStaff } from "@/server/admin-session";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

const adminSections = [
  ["/admin/home", "Home"],
  ["/admin/about", "About Us"],
  ["/admin/rules", "Rules"],
  ["/admin/members", "Members"],
  ["/admin/schedule", "Schedule"],
  ["/admin/leaderboard", "Leaderboard"],
  ["/admin/access", "Access"],
] as const;
/** Organizers manage the schedule of their own sub community and check players in at its Ranked events (the Leaderboard page, without the results editing). */
const organizerSections = [["/admin/schedule", "Schedule"], ["/admin/leaderboard", "Check-in"]] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const roleLabel = staff.isAdmin ? "Admin" : `Organizer · ${staff.roles.flatMap((r) => (r.community_name ? [r.community_name] : [])).join(", ")}`;

  return (
    <>
      <header className="bg-background sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link href="/admin/home" className="flex shrink-0 items-center gap-2" aria-label="Beyblade of Medan Admin">
            <Image src="/brand/logo-768.png" alt="" width={32} height={32} />
            <span className="font-display hidden text-sm font-extrabold italic uppercase sm:inline">Admin</span>
          </Link>
          <AdminNav sections={staff.isAdmin ? adminSections : organizerSections} email={staff.email} role={roleLabel} signOut={signOut} />
          {/* On small screens the profile lives in the Menu. */}
          <div className="hidden md:block"><ProfileMenu email={staff.email} role={roleLabel} signOut={signOut} /></div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </>
  );
}
