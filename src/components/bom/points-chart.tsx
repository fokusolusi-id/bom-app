const W = 600;
const H = 180;
const PAD = 24;

/** Cumulative points after each match as an inline SVG line (no chart library, CSP-safe). */
export function PointsChart({ series }: { series: { at: string; points: number }[] }) {
  if (series.length < 2) {
    return <p className="text-muted-foreground text-sm">Belum cukup match untuk grafik.</p>;
  }
  const max = Math.max(...series.map((s) => s.points), 1);
  const x = (i: number) => PAD + (i / (series.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const line = series.map((s, i) => `${x(i)},${y(s.points)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Poin naik dari ${series[0].points} ke ${series.at(-1)!.points} dalam ${series.length} match`} className="w-full">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="stroke-border" />
      <polyline points={line} fill="none" strokeWidth={3} strokeLinejoin="round" className="stroke-primary" />
      {series.map((s, i) => <circle key={i} cx={x(i)} cy={y(s.points)} r={4} className="fill-primary" />)}
      <text x={PAD} y={14} className="fill-muted-foreground text-[11px]">{max} poin</text>
    </svg>
  );
}
