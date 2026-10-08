import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabase } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin login | BOM" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Card>
        <CardHeader><CardTitle>Admin login</CardTitle></CardHeader>
        <CardContent>
          {hasSupabase()
            ? <LoginForm notice={error === "forbidden" ? "Akun ini belum terdaftar sebagai admin. Tambahkan ke tabel admins, atau masuk dengan akun lain." : undefined} />
            : <p className="text-muted-foreground">Set env Supabase dulu (lihat README).</p>}
        </CardContent>
      </Card>
    </main>
  );
}
