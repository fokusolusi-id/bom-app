import type { Metadata } from "next";
import { CalendarDays, ChevronLeft, ChevronRight, Palmtree } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { eventUsesBomLogo, pickOnePerDay, wibDay, wibTime, type EventType, type ScheduleEventView } from "@/domain/event";
import { monthKey, monthWeeks, parseMonth, shiftMonth, weekdayOf, type Month } from "@/domain/schedule";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO, TIER_ICON } from "@/lib/tier-icon";
import { publicScheduleEvents } from "@/server/schedule-events";

export const metadata: Metadata = { title: "Schedule | BOM" };
export const revalidate = 60;

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

function currentMonth(): Month {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date()).split("-").map(Number);
  return { year, month };
}

// Cell colours follow the competition path tiles: grey Unrank, white-outlined Ranked, green Cup, orange Major, red
// Championship. Text colour is picked for contrast on each ground (black on the orange Major cell).
const CELL: Record<EventType, { bg: string; ink: string; soft: string }> = {
  Unrank: { bg: "bg-[var(--bom-fur-dark)]", ink: "text-white", soft: "text-white/85" },
  Ranked: { bg: "bg-[var(--bom-surface-3)] ring-2 ring-inset ring-white", ink: "text-white", soft: "text-white/80" },
  Cup: { bg: "bg-[#1f5a0d]", ink: "text-white", soft: "text-white/85" },
  Major: { bg: "bg-[var(--bom-orange)]", ink: "text-black", soft: "text-black/80" },
  Championship: { bg: "bg-[var(--bom-loss)]", ink: "text-white", soft: "text-white/90" },
  Break: { bg: "bg-[var(--bom-surface-1)] ring-2 ring-inset ring-[var(--bom-fur)]", ink: "text-[var(--bom-fur-light)]", soft: "text-[var(--bom-fur-light)]/80" },
};

/**
 * One event. The logo (the sub komunitas, or BOM for Cup and above) and the competition icon sit on top; the name,
 * time and place follow on their own lines.
 */
function EventChip({ e }: { e: ScheduleEventView }) {
  const bom = eventUsesBomLogo(e.tier) || !e.community?.image_path;
  const logo = bom ? { src: BOM_LOGO, alt: "BOM" } : { src: mediaUrl(e.community!.image_path!), alt: e.community!.name };
  const c = CELL[e.tier];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Image src={logo.src} alt={logo.alt} width={64} height={64} className="size-12 shrink-0 rounded-md bg-black/40 object-contain p-0.5" />
        {e.tier === "Break"
          ? <Palmtree className={`${c.ink} size-9 shrink-0`} aria-label="Break" />
          : <Image src={TIER_ICON[e.tier]} alt={`BOM ${e.tier}`} width={40} height={40} className="size-9 shrink-0 rounded-md bg-black/40 object-contain p-0.5" />}
      </div>
      <div className={`text-sm leading-tight font-bold ${c.ink}`}>{e.name}</div>
      <div className={`text-xs font-bold ${c.ink}`}>{wibTime(e.starts_at)} WIB</div>
      <div className={`text-xs leading-tight ${c.soft}`}>{e.place}</div>
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
  const eventsOn = (day: number) => byDay.get(day) ?? [];
  const prev = monthKey(shiftMonth(view, -1));
  const next = monthKey(nextMonth);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Schedule</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">Jadwal gathering dan kompetisi BOM. Ikon menunjukkan jenis kompetisi, logo menunjukkan sub komunitas.</p>

      <div className="mt-8 flex items-center justify-between">
        <Link href={`/schedule?m=${prev}`} aria-label="Bulan sebelumnya" className="hover:text-primary p-2"><ChevronLeft /></Link>
        <h2 className="flex items-center gap-2 text-2xl capitalize md:text-4xl"><CalendarDays className="text-primary size-6 md:size-8" aria-hidden />{monthName.format(new Date(Date.UTC(view.year, view.month - 1, 1)))}</h2>
        <Link href={`/schedule?m=${next}`} aria-label="Bulan berikutnya" className="hover:text-primary p-2"><ChevronRight /></Link>
      </div>

      {/* md+: month grid. Below md: agenda list of only the days that have an event. */}
      <div className="mt-4 hidden md:block">
        <div className="text-muted-foreground grid grid-cols-7 gap-px text-center text-xs uppercase">
          {DAY_NAMES.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="bg-border grid auto-rows-[13.5rem] grid-cols-7 gap-px border">
          {weeks.flat().map((day, i) => {
            const list = day ? eventsOn(day) : [];
            const style = list[0] ? CELL[list[0].tier] : null;
            return (
              <div key={i} className={`h-full overflow-hidden p-2 ${style ? style.bg : "bg-card"} ${day ? "" : "opacity-40"}`}>
                {day && <div className={`font-num mb-1 text-sm font-bold ${style ? style.ink : "text-muted-foreground"}`}>{day}</div>}
                {list.map((e) => <EventChip key={e.id} e={e} />)}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 space-y-3 md:hidden">
        {weeks.flat().filter((d): d is number => d !== null && eventsOn(d).length > 0).map((day) => (
          <li key={day}><Card className={`flex-row items-start gap-3 border-0 p-3 ${CELL[eventsOn(day)[0].tier].bg}`}>
            <div className="w-10 text-center">
              <div className={`font-num text-3xl font-black italic ${CELL[eventsOn(day)[0].tier].ink}`}>{day}</div>
              <div className={`text-xs uppercase ${CELL[eventsOn(day)[0].tier].soft}`}>{DAY_NAMES[(weekdayOf(view, day) + 6) % 7]}</div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">{eventsOn(day).map((e) => <EventChip key={e.id} e={e} />)}</div>
          </Card></li>
        ))}
      </ul>
      {events.length === 0 && <p className="text-muted-foreground mt-6 text-sm">Belum ada jadwal bulan ini.</p>}
    </main>
  );
}
