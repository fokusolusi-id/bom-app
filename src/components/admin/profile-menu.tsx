"use client";
import { ChevronDown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** The signed-in admin: a profile button on the right of the header. Opens a card with their email, role and a log out button. */
export function ProfileMenu({ email, role, signOut }: { email: string; role: string; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile"
        className="hover:border-primary flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
      >
        <User className="size-4" aria-hidden />
        <ChevronDown className="size-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="bg-popover text-popover-foreground absolute right-0 z-30 mt-2 w-64 space-y-3 rounded-lg border p-4 shadow-lg">
          <div className="space-y-1">
            <div className="truncate font-bold">{email}</div>
            <div className="text-primary text-sm font-bold uppercase">{role}</div>
          </div>
          <Link href="/admin/account" className="hover:text-primary block text-sm underline" onClick={() => setOpen(false)}>Change password</Link>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full"><LogOut aria-hidden />Log out</Button>
          </form>
        </div>
      )}
    </div>
  );
}
