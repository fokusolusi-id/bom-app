"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "@/components/nav-link";

type Sections = readonly (readonly [href: string, label: string])[];

const LINK = "font-display text-sm font-bold italic uppercase";

/** Admin navigation. A row on wide screens, right-aligned; on small screens one Menu button that opens the list (closes after a pick, a tap outside or Escape). The current section is orange. */
export function AdminNav({ sections }: { sections: Sections }) {
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
          <nav id="admin-menu" aria-label="Admin" className={`${LINK} bg-popover absolute right-0 z-30 mt-2 flex w-48 flex-col rounded-lg border p-2 shadow-lg`} onClick={() => setOpen(false)}>
            {sections.map(([href, label]) => (
              <NavLink key={href} href={href} exact={href === "/admin"} className="rounded px-3 py-2.5">{label}</NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
