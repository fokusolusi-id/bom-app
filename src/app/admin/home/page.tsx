import { AdminSectionsPage } from "@/components/admin/admin-page";
import { GallerySection, SliderSection } from "./media-sections";
import { SponsorSection } from "./sponsor-section";

export const metadata = { title: "Home | Admin BOM" };

const sections = [["slider", "Slider"], ["gallery", "Gallery"], ["sponsors", "Sponsors"]] as const;

/** Everything shown on the homepage that is edited in the admin. */
export default function AdminHomePage() {
  return (
    <AdminSectionsPage title="Home" hint="Homepage content: the What's new slider, the gallery and the sponsor logos." sections={sections}>
      <SliderSection />
      <GallerySection />
      <SponsorSection />
    </AdminSectionsPage>
  );
}
