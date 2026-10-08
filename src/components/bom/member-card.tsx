import Image from "next/image";

/** The member's card, styled after public/print/bom-emoney-03.png (the printed Emoney card). */
export function MemberCard({ bomId, bladerName, since }: { bomId: string; bladerName: string; since: string }) {
  return (
    <div className="relative aspect-[1028/650] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black p-[4%] text-left">
      <div className="flex items-center gap-[4%]">
        <Image src="/brand/logo-768.png" alt="" width={96} height={96} className="size-[17%] shrink-0" />
        <div>
          <div className="text-primary font-display text-[clamp(0.6rem,2.6vw,0.9rem)] font-bold tracking-[0.3em] uppercase">Official Member Card</div>
          <div className="font-display text-[clamp(1rem,5vw,1.6rem)] leading-tight font-extrabold uppercase">Beyblade of Medan</div>
        </div>
      </div>
      <div className="absolute bottom-[10%] left-[4%] space-y-[3%]">
        <div>
          <div className="text-muted-foreground text-[clamp(0.55rem,2.2vw,0.8rem)] uppercase">BOM ID</div>
          <div className="text-primary font-display text-[clamp(1.8rem,10vw,3.4rem)] leading-none font-black uppercase">{bomId.toUpperCase()}</div>
        </div>
        <div className="mt-3">
          <div className="text-muted-foreground text-[clamp(0.55rem,2.2vw,0.8rem)] uppercase">Beyblader name</div>
          <div className="font-display text-[clamp(1.1rem,5.5vw,2rem)] leading-tight font-bold">{bladerName}</div>
        </div>
        <div className="mt-3">
          <div className="text-muted-foreground text-[clamp(0.5rem,2vw,0.75rem)] uppercase">Member since</div>
          <div className="text-[clamp(0.6rem,2.4vw,0.9rem)]">{since}</div>
        </div>
      </div>
      <div aria-hidden className="bg-primary absolute inset-x-0 bottom-0 h-[1.5%]" />
    </div>
  );
}
