import Image from "next/image";

/**
 * The member's card. `design="print"` (the member page) uses the printed Emoney card (public/print/bom-emoney-03-blank.png) as its
 * background; `design="classic"` (the membership sign-up) keeps the original dark card with its own logo, title and stripe.
 * `qr` is a data URL for the QR code on the right.
 */
export function MemberCard({ bomId, bladerName, since, qr, design = "print" }: { bomId: string; bladerName: string; since: string; qr?: string; design?: "print" | "classic" }) {
  const classic = design === "classic";
  return (
    <div data-member-card className={`@container relative aspect-[1028/650] w-full overflow-hidden rounded-xl border border-white/10 text-left ${classic ? "bg-gradient-to-br from-zinc-800 via-zinc-950 to-black p-[4%]" : "bg-black"}`}>
      {classic ? (
        <div className="flex items-center gap-[4%]">
          <Image src="/brand/logo-768.png" alt="" width={96} height={96} className="size-[17%] shrink-0" />
          <div>
            <div className="text-primary font-display text-[2.6cqw] font-bold tracking-[0.3em] uppercase">Official Member Card</div>
            <div className="font-display text-[4.6cqw] leading-tight font-extrabold uppercase">Beyblade of Medan</div>
          </div>
        </div>
      ) : (
        <Image src="/print/bom-emoney-03-blank.png" alt="" fill sizes="(min-width: 768px) 26rem, 100vw" priority className="object-cover" />
      )}
      <div className="absolute bottom-[10%] left-[4%] space-y-[3%]">
        <div>
          <div data-card-text className="text-muted-foreground text-[2.2cqw] uppercase">BOM ID</div>
          <div data-card-text className="text-primary font-display text-[8.5cqw] leading-none font-black uppercase">{bomId.toUpperCase()}</div>
        </div>
        <div className="mt-3">
          <div data-card-text className="text-muted-foreground text-[2.2cqw] uppercase">Beyblader name</div>
          <div data-card-text className="font-display text-[5cqw] leading-tight font-bold">{bladerName}</div>
        </div>
        <div className="mt-3">
          <div data-card-text className="text-muted-foreground text-[2cqw] uppercase">Member since</div>
          <div data-card-text className="text-[2.3cqw]">{since}</div>
        </div>
      </div>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element -- a generated data URL
        <img data-card-qr src={qr} alt={`QR code for ${bomId.toUpperCase()}`} className={`absolute aspect-square rounded-md bg-white ${classic ? "top-[36%] right-[6%] w-[30%]" : "top-[32%] right-[8%] w-[22%]"}`} />
      )}
      {classic && <div aria-hidden className="bg-primary absolute inset-x-0 bottom-0 h-[1.5%]" />}
    </div>
  );
}
