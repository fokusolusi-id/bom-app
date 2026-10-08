import Image from "next/image";
import Link from "next/link";

const nav = [
  ["/kompetisi", "Kompetisi"],
  ["/komunitas", "Komunitas"],
  ["/daftar", "Membership"],
  ["/leaderboard", "Leaderboard"],
] as const;

const linkCls = "font-label text-sm font-bold italic uppercase tracking-[0.08em] hover:text-primary";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/logo-768.png" alt="BOM Beyblade of Medan" width={44} height={44} />
          <span className="font-display text-lg font-extrabold italic uppercase">Beyblade of Medan</span>
        </Link>
        <nav aria-label="Utama" className="hidden gap-6 md:flex">
          {nav.map(([href, label]) => <Link key={href} href={href} className={linkCls}>{label}</Link>)}
        </nav>
        <details className="relative md:hidden">
          <summary className={`${linkCls} cursor-pointer list-none`}>Menu</summary>
          <nav aria-label="Menu" className="bg-popover absolute right-0 z-10 mt-2 flex w-44 flex-col gap-3 rounded border p-4">
            {nav.map(([href, label]) => <Link key={href} href={href} className={linkCls}>{label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
