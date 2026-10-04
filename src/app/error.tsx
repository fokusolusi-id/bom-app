"use client";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-3xl">Terjadi kesalahan</h1>
      <p className="text-muted-foreground">Coba lagi sebentar. Jika masih gagal, hubungi pengurus BOM.</p>
      <Button onClick={reset}>Coba lagi</Button>
    </main>
  );
}
