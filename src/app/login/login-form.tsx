"use client";
import { Loader2 } from "lucide-react";
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
  // On while signing in, and kept on after a success until the admin page has loaded.
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Could not sign in. Check your connection and try again.");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {notice && !error && <p role="status" className="text-muted-foreground text-sm">{notice}</p>}
      <fieldset disabled={busy} className="contents">
        <Input type="email" placeholder="Email" aria-label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" aria-label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        <Button type="submit" aria-busy={busy}>{busy ? <><Loader2 className="animate-spin" aria-hidden />Signing in…</> : "Sign in"}</Button>
      </fieldset>
    </form>
  );
}
