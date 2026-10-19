import Link from "next/link";
import { cn } from "@/lib/utils";

export type SideMenuItem = { href: string; label: string; active: boolean };

/** The vertical menu of the schedule admin: the communities, and Break / Holiday as one more option (admins only). */
export function ScheduleSideMenu({ items }: { items: SideMenuItem[] }) {
  return (
    <nav aria-label="Schedule" className="md:sticky md:top-20 md:self-start">
      <ul className="font-display flex flex-wrap gap-4 text-sm font-bold italic uppercase md:flex-col md:gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} aria-current={item.active ? "page" : undefined} className={cn("block py-1", item.active ? "text-primary" : "hover:text-primary")}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const BREAKS_HREF = "/admin/schedule?tab=breaks";
export const PAST_HREF = "/admin/schedule?tab=past";

/** Midnight today in Medan time, as an ISO instant: events before it are past events (the archives), the rest are upcoming. */
export function startOfTodayWib(now = new Date()): Date {
  const day = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00+07:00`);
}
