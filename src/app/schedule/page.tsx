import type { Metadata } from "next";
import { CalendarDays, ChevronLeft, ChevronRight, Swords } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { GATHERING_TIME, monthKey, monthWeeks, parseMonth, parseWeekday, shiftMonth, weekdayOf, type Month } from "@/domain/schedule";
import { publicSubCommunities } from "@/server/sub-communities";

export const metadata: Metadata = { title: "Schedule | BOM" };
export const revalidate = 60;

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

function currentMonth(): Month {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date()).split("-").map(Number);
  return { year, month };
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const now = currentMonth();
  const view = parseMonth((await searchParams).m, now);
  const subs = await publicSubCommunities().listActive();
  const byWeekday = new Map<number, string[]>();
  for (const s of subs) {
    const d = parseWeekday(s.schedule);
    if (d !== null) byWeekday.set(d, [...(byWeekday.get(d) ?? []), s.name]);
  }
  const weeks = monthWeeks(view);
  const eventsOn = (day: number) => byWeekday.get(weekdayOf(view, day)) ?? [];
  const prev = monthKey(shiftMonth(view, -1));
  const next = monthKey(shiftMonth(view, 1));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Schedule</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">Gathering sub komunitas tiap pekan, mulai pukul {GATHERING_TIME} WIB.</p>

      <div className="mt-8 flex items-center justify-between">
        <Link href={`/schedule?m=${prev}`} aria-label="Bulan sebelumnya" className="hover:text-primary p-2"><ChevronLeft /></Link>
        <h2 className="flex items-center gap-2 text-2xl capitalize md:text-4xl"><CalendarDays className="text-primary size-6 md:size-8" aria-hidden />{monthName.format(new Date(Date.UTC(view.year, view.month - 1, 1)))}</h2>
        <Link href={`/schedule?m=${next}`} aria-label="Bulan berikutnya" className="hover:text-primary p-2"><ChevronRight /></Link>
      </div>

      {/* md+: month grid. Below md: agenda list of only the days that have a gathering. */}
      <div className="mt-4 hidden md:block">
        <div className="text-muted-foreground grid grid-cols-7 gap-px text-center text-xs uppercase">
          {DAY_NAMES.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="bg-border grid grid-cols-7 gap-px border">
          {weeks.flat().map((day, i) => {
            const events = day ? eventsOn(day) : [];
            return (
              <div key={i} className={`bg-card min-h-32 p-2 ${day ? "" : "opacity-40"}`}>
                {day && <div className={`font-num text-sm font-bold ${events.length ? "text-primary" : "text-muted-foreground"}`}>{day}</div>}
                {events.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="text-primary flex items-center gap-1 text-xs font-bold"><Swords className="size-4" aria-hidden />{GATHERING_TIME}</div>
                    {events.map((n) => <div key={n} className="bg-primary/15 truncate rounded px-1.5 py-0.5 text-xs font-semibold">{n}</div>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 space-y-3 md:hidden">
        {weeks.flat().filter((d): d is number => d !== null && eventsOn(d).length > 0).map((day) => (
          <li key={day}><Card className="flex-row items-start gap-3 p-3">
            <div className="font-num text-primary w-10 text-center text-3xl font-black italic">{day}</div>
            <div>
              <div className="text-primary flex items-center gap-1 text-xs font-bold"><Swords className="size-4" aria-hidden />{DAY_NAMES[(weekdayOf(view, day) + 6) % 7]} &middot; {GATHERING_TIME}</div>
              <div className="text-sm font-semibold">{eventsOn(day).join(", ")}</div>
            </div>
          </Card></li>
        ))}
      </ul>
    </main>
  );
}
