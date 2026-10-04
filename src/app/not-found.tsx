import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-3xl">Halaman tidak ditemukan</h1>
      <Button asChild><Link href="/">Kembali ke beranda</Link></Button>
    </main>
  );
}
