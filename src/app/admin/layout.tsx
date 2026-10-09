import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/server/admin-session";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

const sections = [
  ["/admin", "Match"],
  ["/admin/turnamen", "Tournaments"],
  ["/admin/players", "Players"],
  ["/admin/komunitas", "Sub Communities"],
  ["/admin/jadwal", "Schedule"],
  ["/admin/tim", "Founding Team"],
  ["/admin/media", "Slider & Gallery"],
  ["/admin/sponsor", "Sponsor"],
  ["/admin/pendaftar", "Sign-ups"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <header className="bg-background sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link href="/admin" className="flex shrink-0 items-center gap-2" aria-label="BOM Admin">
            <Image src="/brand/logo-768.png" alt="" width={32} height={32} />
            <span className="font-display hidden text-sm font-extrabold italic uppercase sm:inline">Admin</span>
          </Link>
          <AdminNav sections={sections} />
          <div className="flex shrink-0 items-center gap-2">
            <form action={signOut}><Button variant="outline" size="sm">Sign out</Button></form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </>
  );
}
