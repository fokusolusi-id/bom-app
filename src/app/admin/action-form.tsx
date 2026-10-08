"use client";
import { startTransition, useActionState, useEffect, useRef } from "react";
import type { FormState } from "./form-state";

/**
 * Form bound to a server action that returns FormState; shows its error inline.
 * Submits via onSubmit instead of `action` so React doesn't wipe the inputs when validation fails.
 */
export function ActionForm({ action, resetOnSuccess, className, children }: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, run, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => run(data));
      }}
    >
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state.error && <p role="alert" className="text-destructive col-span-full text-sm">{state.error}</p>}
    </form>
  );
}
