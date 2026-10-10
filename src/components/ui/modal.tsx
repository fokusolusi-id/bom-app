"use client";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** A dialog on the native <dialog> element: it traps focus, closes on Escape and dims the page behind it. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`bg-card text-card-foreground m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg border p-0 shadow-xl backdrop:bg-black/70 ${wide ? "max-w-3xl" : "max-w-md"}`}
    >
      {open && (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl">{title}</h2>
            <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={onClose} aria-label="Close"><X aria-hidden /></Button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
