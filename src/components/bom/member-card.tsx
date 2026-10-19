import Image from "next/image";

/** The member's card: the printed Emoney card (public/print/bom-emoney-03.png) as its background, with this member's details on top. `qr` is a data URL for the QR code on the right. */
export function MemberCard({ bomId, bladerName, since, qr }: { bomId: string; bladerName: string; since: string; qr?: string }) {
  return (
    <div className="@container relative aspect-[1028/650] w-full overflow-hidden rounded-xl border border-white/10 bg-black text-left">
      {/* The artwork already has the logo, the title, the claws and the stripe at the bottom. */}
      <Image src="/print/bom-emoney-03.png" alt="" fill sizes="(min-width: 768px) 26rem, 100vw" priority className="object-cover" />
      <div className="absolute bottom-[10%] left-[4%] space-y-[3%]">
        <div>
          <div className="text-muted-foreground text-[2.2cqw] uppercase">BOM ID</div>
          <div className="text-primary font-display text-[8.5cqw] leading-none font-black uppercase">{bomId.toUpperCase()}</div>
        </div>
        <div className="mt-3">
          <div className="text-muted-foreground text-[2.2cqw] uppercase">Beyblader name</div>
          <div className="font-display text-[5cqw] leading-tight font-bold">{bladerName}</div>
        </div>
        <div className="mt-3">
          <div className="text-muted-foreground text-[2cqw] uppercase">Member since</div>
          <div className="text-[2.3cqw]">{since}</div>
        </div>
      </div>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element -- a generated data URL
        <img src={qr} alt={`QR code for ${bomId.toUpperCase()}`} className="absolute top-[32%] right-[8%] aspect-square w-[22%] rounded-md bg-white" />
      )}
    </div>
  );
}
