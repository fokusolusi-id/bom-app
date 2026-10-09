"use client";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground">Try again in a moment. If it keeps failing, contact the BOM committee.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
