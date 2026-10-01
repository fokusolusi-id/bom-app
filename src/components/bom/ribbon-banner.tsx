import { cn } from "@/lib/utils";

export function RibbonBanner({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("chamfer-lg inline-block bg-white p-[3px]", className)}>
      <div className="chamfer-lg bg-black px-8 py-2">
        <span className="font-display text-xl font-extrabold italic uppercase tracking-wide">{children}</span>
      </div>
    </div>
  );
}
