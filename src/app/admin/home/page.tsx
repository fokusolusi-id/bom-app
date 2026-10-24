import { AdminSectionsPage } from "@/components/admin/admin-page";
import { GallerySection, PopupSection, SliderSection } from "./media-sections";
import { PackageSponsorsSection, SponsorSection } from "./sponsor-section";
import { SponsorshipInfoSection } from "./sponsorship-info";

export const metadata = { title: "Home | Admin Beyblade of Medan" };

const sections = [["popup", "Event pop-up"], ["slider", "Slider"], ["gallery", "Gallery"], ["sponsors", "Supported By"], ["package-sponsors", "Sponsors"], ["sponsorship", "Sponsorship"]] as const;

/** Everything shown on the homepage that is edited in the admin. */
export default function AdminHomePage() {
  return (
    <AdminSectionsPage title="Home" hint="Homepage content: the event pop-up, the What's new slider, the gallery, the Supported By logos, the Gold, Silver and Bronze sponsors and the internal sponsorship packages." sections={sections}>
      <PopupSection />
      <SliderSection />
      <GallerySection />
      <SponsorSection />
      <PackageSponsorsSection />
      <SponsorshipInfoSection />
    </AdminSectionsPage>
  );
}
