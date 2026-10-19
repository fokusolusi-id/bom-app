import Link from "next/link";
import { cn } from "@/lib/utils";
import { PAST_HREF } from "./side-menu";

/** The two tabs of the schedule admin: events still to come (from today), and past events. */
export function ScheduleTabs({ active }: { active: "upcoming" | "past" }) {
  const tabs = [["upcoming", "Upcoming Events", "/admin/schedule"], ["past", "Past Events", PAST_HREF]] as const;
  return (
    <nav aria-label="Schedule" className="mb-8 flex flex-wrap border-b">
      {tabs.map(([key, label, href]) => (
        <Link
          key={key} href={href} aria-current={active === key ? "page" : undefined}
          className={cn("font-label -mb-px border-b-2 px-4 py-2 text-sm font-bold uppercase italic", active === key ? "text-primary border-primary" : "text-muted-foreground hover:text-primary border-transparent")}
        >{label}</Link>
      ))}
    </nav>
  );
}
