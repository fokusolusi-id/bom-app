import type { Metadata } from "next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CompetitionLadder } from "@/components/bom/competition-ladder";
import { TierTile } from "@/components/bom/tier-tile";
import { JoinUs } from "@/components/bom/join-us";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { SectionHeading } from "@/components/bom/section-heading";
import { eventPlace, eventUsesBomLogo, pickOnePerDay, wibDay, wibTime, type ScheduleEventView } from "@/domain/event";
import { monthKey, monthWeeks, parseMonth, shiftMonth, weekdayOf, type Month } from "@/domain/schedule";
import { mediaUrl } from "@/lib/media";
import { EVENT_STYLE, EVENT_TYPE_LABEL } from "@/lib/event-style";
import { BOM_LOGO } from "@/lib/tier-icon";
import { VENUE } from "@/lib/venue";
import { publicScheduleEvents } from "@/server/schedule-events";

export const metadata: Metadata = { title: "Schedule | BOM" };
export const revalidate = 60;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

function currentMonth(): Month {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date()).split("-").map(Number);
  return { year, month };
}

/**
 * One event: the logo (the sub komunitas, or BOM for Cup and above) and the competition icon on top, then the type name,
 * event name, time and place on their own lines. A break has no logo and no time, just its icon.
 */
function EventChip({ e }: { e: ScheduleEventView }) {
  const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
  const logo = bom ? { src: BOM_LOGO, alt: "BOM" } : { src: mediaUrl(e.community!.image_path!), alt: e.community!.name };
  const c = EVENT_STYLE[e.tier];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {/* A break has no logo, only its tile. */}
        {e.tier !== "Break" && <Image src={logo.src} alt={logo.alt} width={96} height={96} className="size-16 shrink-0 object-contain" />}
        <TierTile tier={e.tier} className={e.tier === "Break" ? "size-16" : "size-14"} />
      </div>
      <div className={`font-label text-[11px] font-bold tracking-[0.08em] uppercase italic ${c.soft}`}>{EVENT_TYPE_LABEL(e.tier)}</div>
      <div className={`text-sm leading-tight font-bold ${c.ink}`}>{e.name}</div>
      {e.tier !== "Break" && <div className={`text-xs font-bold ${c.ink}`}>{wibTime(e.starts_at)} WIB</div>}
      <div className={`text-xs leading-tight ${c.soft}`}>{eventPlace(e, VENUE)}</div>
    </div>
  );
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const now = currentMonth();
  const view = parseMonth((await searchParams).m, now);
  const start = `${monthKey(view)}-01T00:00:00+07:00`;
  const nextMonth = shiftMonth(view, 1);
  const end = `${monthKey(nextMonth)}-01T00:00:00+07:00`;
  const events = await publicScheduleEvents().between(new Date(start).toISOString(), new Date(end).toISOString());
  const byDay = new Map<number, ScheduleEventView[]>();
  for (const e of pickOnePerDay(events)) {
    const day = Number(wibDay(e.starts_at).slice(8, 10));
    byDay.set(day, [...(byDay.get(day) ?? []), e]);
  }
  const weeks = monthWeeks(view);
  const today = view.year === now.year && view.month === now.month ? Number(new Intl.DateTimeFormat("en-CA", { day: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date())) : null;
  const eventsOn = (day: number) => byDay.get(day) ?? [];
  const prev = monthKey(shiftMonth(view, -1));
  const next = monthKey(nextMonth);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Schedule</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">BOM gatherings and competitions. The icon shows the competition type and the logo shows the sub community.</p>

      <div className="mt-8 flex items-center justify-between">
        <Link href={`/schedule?m=${prev}`} aria-label="Previous month" className="hover:text-primary p-2"><ChevronLeft /></Link>
        <h2 className="flex items-center gap-2 text-2xl capitalize md:text-4xl"><CalendarDays className="text-primary size-6 md:size-8" aria-hidden />{monthName.format(new Date(Date.UTC(view.year, view.month - 1, 1)))}</h2>
        <Link href={`/schedule?m=${next}`} aria-label="Next month" className="hover:text-primary p-2"><ChevronRight /></Link>
      </div>

      {/* md+: month grid. Below md: agenda list of only the days that have an event. */}
      <div className="mt-4 hidden md:block">
        <div className="text-muted-foreground grid grid-cols-7 gap-px text-center text-xs uppercase">
          {DAY_NAMES.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="bg-border grid auto-rows-[14rem] grid-cols-7 gap-px border">
          {weeks.flat().map((day, i) => {
            const list = day ? eventsOn(day) : [];
            const style = list[0] ? EVENT_STYLE[list[0].tier] : null;
            return (
              <div key={i} className={`h-full overflow-hidden px-2 pt-2 pb-1 ${style ? style.bg : "bg-card"} ${day ? "" : "opacity-40"} ${day && day === today ? "ring-primary ring-1 ring-inset" : ""}`}>
                {day && <div className={`font-num mb-1 text-sm font-bold ${style ? style.ink : "text-muted-foreground"}`}>{day}</div>}
                {list.map((e) => <EventChip key={e.id} e={e} />)}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 space-y-3 md:hidden">
        {weeks.flat().filter((d): d is number => d !== null && eventsOn(d).length > 0).map((day) => (
          <li key={day}><Card className={`flex-row items-start gap-3 border-0 p-3 ${EVENT_STYLE[eventsOn(day)[0].tier].bg}`}>
            <div className="w-10 text-center">
              <div className={`font-num text-3xl font-black italic ${EVENT_STYLE[eventsOn(day)[0].tier].ink}`}>{day}</div>
              <div className={`text-xs uppercase ${EVENT_STYLE[eventsOn(day)[0].tier].soft}`}>{DAY_NAMES[(weekdayOf(view, day) + 6) % 7]}</div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">{eventsOn(day).map((e) => <EventChip key={e.id} e={e} />)}</div>
          </Card></li>
        ))}
      </ul>
      {events.length === 0 && <p className="text-muted-foreground mt-6 text-sm">No events this month.</p>}

      <section aria-labelledby="types" className="mt-16">
        <SectionHeading id="types">Competition types</SectionHeading>
        <p className="text-muted-foreground max-w-3xl">
          To bring more clarity and structure to our competitions, BOM runs a tiered event system. Whether you are a casual player or a top competitor, there is an event for everyone.
        </p>
        <div className="mt-8"><CompetitionLadder scheduleLink={false} /></div>
        <p className="text-muted-foreground mt-8 max-w-3xl">
          From championship battles to casual side events, every BOM event is designed to make Beyblade X more competitive, engaging and fun. Let&apos;s level up the game together and make every tournament count.
        </p>
      </section>

      <JoinUs className="mt-16" />
    </main>
  );
}
