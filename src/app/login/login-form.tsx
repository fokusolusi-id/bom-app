"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ notice }: { notice?: string }) {
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
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {notice && !error && <p role="status" className="text-muted-foreground text-sm">{notice}</p>}
      <Input type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <Button type="submit">Sign in</Button>
    </form>
  );
}
