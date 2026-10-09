"use client";

import { usePathname } from "next/navigation";

/** The public header and footer step aside in /admin, which has its own navigation bar. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : <>{children}</>;
}
