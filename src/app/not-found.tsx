import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <Button asChild><Link href="/">Back to home</Link></Button>
    </main>
  );
}
