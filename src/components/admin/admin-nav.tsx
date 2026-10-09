"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Horizontal admin navigation; scrolls sideways on narrow screens. The current section is highlighted. */
export function AdminNav({ sections }: { sections: readonly (readonly [href: string, label: string])[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="font-display -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto text-sm font-bold italic uppercase [scrollbar-width:none]">
      {sections.map(([href, label]) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href} href={href} aria-current={active ? "page" : undefined}
            className={cn("shrink-0 rounded px-3 py-2 whitespace-nowrap", active ? "bg-primary text-primary-foreground" : "hover:text-primary")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
