import { CircleHelp } from "lucide-react";
import { useId } from "react";

/** A small "?" that shows its help in a tooltip on hover, keyboard focus or tap. */
export function HelpTip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={label} aria-describedby={id} className="text-muted-foreground hover:text-primary focus-visible:text-primary rounded-full">
        <CircleHelp className="size-4" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className="bg-popover text-popover-foreground pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-72 max-w-[80vw] -translate-x-1/2 space-y-2 rounded-md border p-3 text-xs font-normal opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
