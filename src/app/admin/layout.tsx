import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/server/admin-session";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

const sections = [
  ["/admin", "Match"],
  ["/admin/komunitas", "Sub Komunitas"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <aside className="md:w-52 md:shrink-0">
        <nav aria-label="Admin" className="font-display flex gap-4 text-sm font-bold italic uppercase md:flex-col">
          {sections.map(([href, label]) => <Link key={href} href={href} className="hover:text-primary">{label}</Link>)}
        </nav>
        <form action={signOut} className="mt-6"><Button variant="outline" size="sm">Keluar</Button></form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
