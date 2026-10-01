import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/logo-768.png" alt="BOM Beyblade of Medan" width={44} height={44} />
          <span className="font-display text-lg font-extrabold italic uppercase">Beyblade of Medan</span>
        </Link>
        <nav className="font-display flex gap-6 text-sm font-bold italic uppercase">
          <Link href="/kompetisi" className="hover:text-primary hidden md:inline">Kompetisi</Link>
          <Link href="/komunitas" className="hover:text-primary hidden md:inline">Komunitas</Link>
          <Link href="/mulai" className="hover:text-primary hidden md:inline">Mulai</Link>
          <Link href="/leaderboard" className="hover:text-primary">Leaderboard</Link>
        </nav>
      </div>
    </header>
  );
}
