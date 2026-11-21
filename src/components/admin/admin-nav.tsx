"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";

type Sections = readonly (readonly [href: string, label: string])[];

const LINK = "font-display text-sm font-bold italic uppercase";

/** Admin navigation. A row on wide screens, right-aligned; on small screens one Menu button that opens the list (closes after a pick, a tap outside or Escape), with the signed-in profile and Log out at the bottom. The current section is orange. */
export function AdminNav({ sections, email, role, signOut }: { sections: Sections; email: string; role: string; signOut: () => Promise<void> }) {
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
    <div className="flex min-w-0 flex-1 justify-end">
      <nav aria-label="Admin" className={`${LINK} hidden items-center gap-1 md:flex`}>
        {sections.map(([href, label]) => (
          <NavLink key={href} href={href} exact={href === "/admin"} className="shrink-0 px-3 py-2 whitespace-nowrap">{label}</NavLink>
        ))}
      </nav>

      <div ref={ref} className="relative md:hidden">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="admin-menu" className={`${LINK} hover:text-primary flex items-center gap-1.5 px-2 py-2`}>
          {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}Menu
        </button>
        {open && (
          <div className="bg-popover absolute right-0 z-30 mt-2 w-64 rounded-lg border p-2 shadow-lg">
            <nav id="admin-menu" aria-label="Admin" className={`${LINK} flex flex-col`} onClick={() => setOpen(false)}>
              {sections.map(([href, label]) => (
                <NavLink key={href} href={href} exact={href === "/admin"} className="rounded px-3 py-2.5">{label}</NavLink>
              ))}
            </nav>
            <div className="mt-2 space-y-3 border-t px-3 pt-3 pb-1">
              <div className="space-y-1">
                <div className="truncate font-bold">{email}</div>
                <div className="text-primary text-sm font-bold uppercase">{role}</div>
              </div>
              <Link href="/admin/account" className="hover:text-primary block text-sm underline" onClick={() => setOpen(false)}>Change password</Link>
              <form action={signOut}>
                <Button type="submit" variant="outline" className="w-full"><LogOut aria-hidden />Log out</Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
