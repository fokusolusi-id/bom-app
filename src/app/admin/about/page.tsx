import { AdminSectionsPage } from "@/components/admin/admin-page";
import { CommunitiesSection } from "./communities-section";
import { TeamSection } from "./team-section";

export const metadata = { title: "About BOM | Admin BOM" };

const sections = [["sub-communities", "Sub Communities"], ["team", "Founding Team"]] as const;

/** What the About page and the homepage say about who BOM is. */
export default function AdminAboutPage() {
  return (
    <AdminSectionsPage title="About BOM" hint="The sub communities and the founding team." sections={sections}>
      <CommunitiesSection />
      <TeamSection />
    </AdminSectionsPage>
  );
}
