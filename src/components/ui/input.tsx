import * as React from "react";
import { cn } from "@/lib/utils";

const field = "bg-input w-full min-w-0 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(field, className)} {...props} />;
}
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(field, className)} {...props} />;
}
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="native-select" className={cn(field, className)} {...props} />;
}
export { Input, Textarea, NativeSelect };
