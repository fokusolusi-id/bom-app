import { AdminPage } from "@/components/admin/admin-page";
import { GallerySection, SliderSection } from "./media-sections";
import { SponsorSection } from "./sponsor-section";

export const metadata = { title: "Home | Admin BOM" };

const sections = [
  ["#slider", "Slider"],
  ["#gallery", "Gallery"],
  ["#sponsors", "Sponsors"],
] as const;

/** Everything shown on the homepage that is edited in the admin, with a side menu to jump between the parts. */
export default function AdminHomePage() {
  return (
    <AdminPage title="Home" hint="Homepage content: the What's new slider, the gallery and the sponsor logos.">
      <div className="grid gap-8 md:grid-cols-[11rem_1fr]">
        <nav aria-label="Home sections" className="md:sticky md:top-20 md:self-start">
          <ul className="font-display flex gap-4 text-sm font-bold italic uppercase md:flex-col md:gap-1">
            {sections.map(([href, label]) => (
              <li key={href}><a href={href} className="hover:text-primary block py-1">{label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-14">
          <SliderSection />
          <GallerySection />
          <SponsorSection />
        </div>
      </div>
    </AdminPage>
  );
}
