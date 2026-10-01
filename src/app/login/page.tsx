"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { router.push("/admin"); router.refresh(); }
  }
  const field = "bg-input w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-ring";
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Card>
        <CardHeader><CardTitle>Admin login</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit">Masuk</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
