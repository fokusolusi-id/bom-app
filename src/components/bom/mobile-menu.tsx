"use client";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "@/components/nav-link";

/** The menu on small screens. It closes after a link is picked, when you tap outside it, or on Escape. */
export function MobileMenu({ nav, linkClass }: { nav: readonly (readonly [href: string, label: string])[]; linkClass: string }) {
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
    <div ref={ref} className="relative md:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" className={`${linkClass} hover:text-primary flex items-center gap-1.5`}>
        {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}Menu
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Menu" className="bg-popover absolute right-0 z-10 mt-2 flex w-44 flex-col gap-3 rounded border p-4" onClick={() => setOpen(false)}>
          {nav.map(([href, label]) => <NavLink key={href} href={href} className={linkClass}>{label}</NavLink>)}
        </nav>
      )}
    </div>
  );
}
