import type { Metadata } from "next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { wibDay, wibTime, type ScheduleEventView } from "@/domain/event";
import { monthKey, monthWeeks, parseMonth, shiftMonth, weekdayOf, type Month } from "@/domain/schedule";
import { mediaUrl } from "@/lib/media";
import { TIER_ICON } from "@/lib/tier-icon";
import { publicScheduleEvents } from "@/server/schedule-events";

export const metadata: Metadata = { title: "Schedule | BOM" };
export const revalidate = 60;

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

function currentMonth(): Month {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date()).split("-").map(Number);
  return { year, month };
}

/** One event: competition icon, sub komunitas logo, name and time. */
function EventChip({ e, roomy }: { e: ScheduleEventView; roomy?: boolean }) {
  return (
    <div className="bg-primary/15 flex items-center gap-1.5 rounded px-1.5 py-1" title={`${e.name} · ${e.community?.name ?? "BOM"} · ${wibTime(e.starts_at)} WIB · ${e.place}`}>
      <Image src={TIER_ICON[e.tier]} alt={`BOM ${e.tier}`} width={28} height={28} className="size-6 shrink-0 object-contain" />
      {e.community?.image_path && <Image src={mediaUrl(e.community.image_path)} alt={e.community.name} width={28} height={28} className="size-6 shrink-0 rounded-sm object-contain" />}
      <div className="min-w-0">
        <div className={`font-semibold ${roomy ? "text-sm" : "truncate text-xs"}`}>{e.name}</div>
        <div className="text-muted-foreground text-[11px]">{wibTime(e.starts_at)} WIB{roomy ? ` · ${e.place}` : ""}</div>
      </div>
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
  for (const e of events) {
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
        <div className="bg-border grid grid-cols-7 gap-px border">
          {weeks.flat().map((day, i) => {
            const list = day ? eventsOn(day) : [];
            return (
              <div key={i} className={`bg-card min-h-32 p-2 ${day ? "" : "opacity-40"}`}>
                {day && <div className={`font-num text-sm font-bold ${list.length ? "text-primary" : "text-muted-foreground"}`}>{day}</div>}
                {list.length > 0 && <div className="mt-1 space-y-1">{list.map((e) => <EventChip key={e.id} e={e} />)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 space-y-3 md:hidden">
        {weeks.flat().filter((d): d is number => d !== null && eventsOn(d).length > 0).map((day) => (
          <li key={day}><Card className="flex-row items-start gap-3 p-3">
            <div className="w-10 text-center">
              <div className="font-num text-primary text-3xl font-black italic">{day}</div>
              <div className="text-muted-foreground text-xs uppercase">{DAY_NAMES[(weekdayOf(view, day) + 6) % 7]}</div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">{eventsOn(day).map((e) => <EventChip key={e.id} e={e} roomy />)}</div>
          </Card></li>
        ))}
      </ul>
      {events.length === 0 && <p className="text-muted-foreground mt-6 text-sm">Belum ada jadwal bulan ini.</p>}
    </main>
  );
}
