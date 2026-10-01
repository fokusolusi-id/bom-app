import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

const sections = [
  ["/admin", "Match"],
  ["/admin/komunitas", "Sub Komunitas"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabase()) {
    return <main className="mx-auto max-w-xl px-4 py-16"><p className="text-muted-foreground">Set env Supabase dulu (lihat README).</p></main>;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return <main className="mx-auto max-w-xl px-4 py-16"><p>Akun ini belum terdaftar sebagai admin. Tambahkan ke tabel admins.</p></main>;

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
