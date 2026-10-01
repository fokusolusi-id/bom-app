import { cn } from "@/lib/utils";

export function ScoreTile({ name, score, combo, leading, tv }: { name: string; score: number; combo?: string; leading?: boolean; tv?: boolean }) {
  return (
    <div className={cn("chamfer-lg flex flex-col items-center justify-center gap-2 border-0 p-8", leading ? "bg-primary text-primary-foreground" : "bg-card")}>
      <div className={cn("font-display font-extrabold italic uppercase", tv ? "text-6xl" : "text-2xl")}>{name}</div>
      <div className={cn("font-display tabular font-black italic leading-none", tv ? "text-[16rem]" : "text-8xl")}>{score}</div>
      {combo && <div className={cn("font-bold uppercase tracking-wider opacity-80", tv ? "text-3xl" : "text-sm")}>{combo}</div>}
    </div>
  );
}
