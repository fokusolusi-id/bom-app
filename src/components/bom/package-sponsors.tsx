import Image from "next/image";
import { SPONSOR_TIERS, type Sponsor, type SponsorTier } from "@/domain/sponsor";
import { mediaUrl } from "@/lib/media";

const LOOK: Record<SponsorTier, { label: string; text: string; logo: string }> = {
  gold: { label: "Gold sponsor", text: "text-[var(--bom-sponsor-gold)]", logo: "h-20 sm:h-24" },
  silver: { label: "Silver sponsor", text: "text-[var(--bom-sponsor-silver)]", logo: "h-14 sm:h-16" },
  bronze: { label: "Bronze sponsor", text: "text-[var(--bom-sponsor-bronze)]", logo: "h-10 sm:h-12" },
};

/** The sponsors by package, Gold first, each package on its own row with bigger logos for higher packages. Packages without a sponsor are left out. */
export function PackageSponsors({ sponsors }: { sponsors: Sponsor[] }) {
  const groups = SPONSOR_TIERS.map(([tier]) => ({ tier, items: sponsors.filter((s) => s.tier === tier) })).filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;
  return (
    <div className="space-y-6">
      {groups.map(({ tier, items }) => (
        <div key={tier} className="space-y-3">
          <div className={`font-label text-xs font-bold tracking-[0.2em] uppercase italic ${LOOK[tier].text}`}>{LOOK[tier].label}{items.length > 1 ? "s" : ""}</div>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {items.map((s) => {
              const logo = <Image src={mediaUrl(s.logo_path)} alt={s.name} width={480} height={240} className={`${LOOK[tier].logo} w-auto max-w-full object-contain`} />;
              return (
                <li key={s.id ?? s.name}>
                  {s.website ? <a href={s.website} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="block transition-opacity hover:opacity-80">{logo}</a> : logo}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
