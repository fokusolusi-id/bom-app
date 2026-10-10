"use client";

import { NavLink } from "@/components/nav-link";

/** Horizontal admin navigation, right-aligned. Scrolls sideways on narrow screens. The current section is orange. */
export function AdminNav({ sections }: { sections: readonly (readonly [href: string, label: string])[] }) {
  return (
    <nav aria-label="Admin" className="font-display flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm font-bold italic uppercase [scrollbar-width:none] [&>*:first-child]:ml-auto">
      {sections.map(([href, label]) => (
        <NavLink key={href} href={href} exact={href === "/admin"} className="shrink-0 px-3 py-2 whitespace-nowrap">{label}</NavLink>
      ))}
    </nav>
  );
}
