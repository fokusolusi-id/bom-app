import { cn } from "@/lib/utils";

/** Small orange eyebrow heading that opens a page section. */
export function SectionHeading({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-primary mb-4 text-sm tracking-widest uppercase", className)} {...props} />;
}
