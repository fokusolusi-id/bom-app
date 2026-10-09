"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Navigation link whose only active style is the orange text colour. `exact` skips sub-pages (e.g. /admin vs /admin/tim). */
export function NavLink({ href, exact, className, ...props }: React.ComponentProps<typeof Link> & { href: string; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
  return <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active ? "text-primary" : "hover:text-primary")} {...props} />;
}
