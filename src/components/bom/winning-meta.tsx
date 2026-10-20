import { parseCombo, type Tally } from "@/domain/combos";
import type { WinningMeta } from "@/server/winning-meta";
import { Card } from "@/components/ui/card";

const W = 440;
const H = 340;
const CX = W / 2;
const CY = H / 2;
const R = 100;
const RINGS = [0.25, 0.5, 0.75, 1];

/** The most used combos as a radar chart: one spoke per combo, as long as the number of times it won. Needs three or more combos. */
function ComboRadar({ combos }: { combos: Tally[] }) {
  const n = combos.length;
  const max = Math.max(...combos.map((c) => c.count));
  const point = (i: number, scale: number): [number, number] => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [CX + Math.cos(angle) * R * scale, CY + Math.sin(angle) * R * scale];
  };
  const polygon = (scale: (i: number) => number) => combos.map((_, i) => point(i, scale(i)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Radar chart of the most used winning combos: ${combos.map((c) => `${c.name} ${c.count}`).join(", ")}`} className="mx-auto h-auto w-full max-w-md">
      {RINGS.map((r) => <polygon key={r} points={polygon(() => r)} className="fill-none stroke-white/15" />)}
      {combos.map((_, i) => { const [x, y] = point(i, 1); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} className="stroke-white/15" />; })}
      <polygon points={polygon((i) => combos[i].count / max)} className="fill-primary/30 stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      {combos.map((c, i) => {
        const [x, y] = point(i, c.count / max);
        const [lx, ly] = point(i, 1.2);
        const anchor = Math.abs(lx - CX) < 8 ? "middle" : lx > CX ? "start" : "end";
        return (
          <g key={c.name}>
            <circle cx={x} cy={y} r={4} className="fill-primary" />
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="fill-white font-mono text-[11px] font-bold">{c.name}</text>
            <text x={lx} y={ly + 14} textAnchor={anchor} dominantBaseline="middle" className="fill-neutral-400 text-[10px]">{c.count}x</text>
          </g>
        );
      })}
    </svg>
  );
}

/** "Winning Combo": the combo the top eight win with most, and a radar chart of the most used combos, from Ranked and bigger events. */
export function WinningMetaCards({ meta }: { meta: WinningMeta }) {
  const best = meta.combo[0];
  if (!best) return null;
  const parts = parseCombo(best.name);
  const radar = meta.combo.slice(0, 6);
  return (
    <>
      <div className={`grid gap-4 ${radar.length >= 3 ? "md:grid-cols-2" : ""}`}>
        <Card className="justify-center gap-3">
          <div className="text-muted-foreground text-xs uppercase">Top combo</div>
          <div className="font-num text-5xl leading-none font-black break-words text-white italic sm:text-6xl">{best.name}</div>
          <div className="text-muted-foreground text-sm">Won {best.count} {best.count === 1 ? "time" : "times"} · {Math.round((best.count / meta.total) * 100)}% of the winning combos</div>
          <ul className="flex flex-wrap gap-2">
            {([["Blade", parts.blade], ["Ratchet", parts.ratchet], ["Bit", parts.bit]] as const).map(([label, value]) => value && (
              <li key={label} className="rounded-md border px-2.5 py-1">
                <span className="text-muted-foreground mr-1.5 text-xs uppercase">{label}</span>
                <span className="font-mono font-bold">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
        {radar.length >= 3 && (
          <Card className="gap-2">
            <div className="text-muted-foreground text-xs uppercase">Most used combos</div>
            <ComboRadar combos={radar} />
          </Card>
        )}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">From {meta.total} winning {meta.total === 1 ? "combo" : "combos"} of the top 8 in {meta.events} Ranked or bigger {meta.events === 1 ? "event" : "events"}.</p>
    </>
  );
}
