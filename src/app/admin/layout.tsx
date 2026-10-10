import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProfileMenu } from "@/components/admin/profile-menu";
import { requireStaff } from "@/server/admin-session";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

const adminSections = [
  ["/admin/home", "Home"],
  ["/admin/about", "About BOM"],
  ["/admin/rules", "Rules"],
  ["/admin/members", "Members"],
  ["/admin/schedule", "Schedule"],
  ["/admin/leaderboard", "Leaderboard"],
  ["/admin/access", "Access"],
] as const;
/** Organizers manage the schedule and the results of their own sub community, nothing else. */
const organizerSections = [["/admin/schedule", "Schedule"], ["/admin/leaderboard", "Results"]] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const roleLabel = staff.isAdmin ? "Admin" : `Organizer · ${staff.roles.flatMap((r) => (r.community_name ? [r.community_name] : [])).join(", ")}`;

  return (
    <>
      <header className="bg-background sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link href="/admin/home" className="flex shrink-0 items-center gap-2" aria-label="BOM Admin">
            <Image src="/brand/logo-768.png" alt="" width={32} height={32} />
            <span className="font-display hidden text-sm font-extrabold italic uppercase sm:inline">Admin</span>
          </Link>
          <AdminNav sections={staff.isAdmin ? adminSections : organizerSections} />
          <ProfileMenu email={staff.email} role={roleLabel} signOut={signOut} />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </>
  );
}
