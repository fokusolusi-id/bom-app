import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "@/components/bom/mobile-menu";
import { NavLink } from "@/components/nav-link";

const nav = [
  ["/about-us", "About Us"],
  ["/sponsorship", "Sponsorship"],
  ["/rules", "Rules"],
  ["/membership", "Membership"],
  ["/schedule", "Schedule"],
  ["/leaderboard", "Leaderboard"],
] as const;

const linkCls = "font-label text-xs font-bold italic uppercase tracking-[0.04em] whitespace-nowrap lg:text-sm lg:tracking-[0.08em]";

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/brand/logo-768.png" alt="Beyblade of Medan" width={44} height={44} />
          <span className="font-display text-base font-extrabold whitespace-nowrap italic uppercase lg:text-lg">Beyblade of Medan</span>
        </Link>
        <nav aria-label="Main" className="hidden gap-3 md:flex lg:gap-6">
          {nav.map(([href, label]) => <NavLink key={href} href={href} className={linkCls}>{label}</NavLink>)}
        </nav>
        <MobileMenu nav={nav} linkClass={linkCls} />
      </div>
    </header>
  );
}
