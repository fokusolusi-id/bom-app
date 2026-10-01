import { cn } from "@/lib/utils";

/** Signature BOM element: orange solid arc running into white ticks. value 0-100. */
export function TickArcMeter({ value, size = 200, label, className }: { value: number; size?: number; label?: string; className?: string }) {
  const ticks = 24;
  const r = 44;
  const filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * ticks);
  const start = -210, sweep = 240;
  const items = Array.from({ length: ticks }, (_, i) => {
    const a = ((start + (sweep / (ticks - 1)) * i) * Math.PI) / 180;
    const x1 = 50 + Math.cos(a) * (r - 7), y1 = 50 + Math.sin(a) * (r - 7);
    const x2 = 50 + Math.cos(a) * r, y2 = 50 + Math.sin(a) * r;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i < filled ? 4 : 2.5} className={i < filled ? "stroke-primary" : "stroke-white/70"} strokeLinecap="butt" />;
  });
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0" role="img" aria-label={`${label ?? "Progress"} ${value}%`}>{items}</svg>
      <div className="text-center">
        <div className="font-display tabular text-4xl font-black italic">{value}<span className="text-primary text-xl">%</span></div>
        {label && <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{label}</div>}
      </div>
    </div>
  );
}
