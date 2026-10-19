import type { HistoryRow } from "@/domain/standings";

const W = 640;
const H = 240;
const PAD = { top: 20, right: 20, bottom: 36, left: 44 };
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });

/** Points history as an area chart of the running total, with a dot and the total at each event. Plain SVG, so it renders on the server. */
export function PointsChart({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.total), 1);
  const top = Math.ceil(max / 5) * 5 || 5;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const step = plotW / rows.length;
  const x = (i: number) => PAD.left + step * (i + 0.5);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t * 100) / 100);
  const labelEvery = Math.ceil(rows.length / 8);
  const line = rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(r.total)}`).join(" ");

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Points history: ${rows.map((r) => `${day.format(new Date(r.startsAt))} ${r.total}`).join(", ")}`} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{t}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="points-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="[stop-color:var(--bom-orange)]" stopOpacity="0.45" />
            <stop offset="100%" className="[stop-color:var(--bom-orange)]" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`${line} L${x(rows.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#points-area)" />
        {rows.map((r, i) => (i % labelEvery === 0 ? <text key={r.eventId} x={x(i)} y={H - 12} textAnchor="middle" className="fill-muted-foreground text-[11px]">{day.format(new Date(r.startsAt))}</text> : null))}
        <path d={line} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {rows.map((r, i) => (
          <g key={`${r.eventId}-dot`}>
            <circle cx={x(i)} cy={y(r.total)} r="4" className="fill-primary" />
            <text x={x(i)} y={y(r.total) - 10} textAnchor="middle" className="fill-foreground text-[11px] font-bold">{r.total}</text>
          </g>
        ))}
      </svg>
      <figcaption className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="bg-primary inline-block h-0.5 w-4" aria-hidden />Total points after each event</span>
      </figcaption>
    </figure>
  );
}
