import { AdminSectionsPage } from "@/components/admin/admin-page";
import { NonMembersSection } from "./non-members-section";
import { PlayersSection } from "./players-section";
import { SignupsSection } from "./signups-section";

export const metadata = { title: "Members | Admin Beyblade of Medan" };

const sections = [["sign-ups", "Waiting for activation"], ["members", "Members"], ["non-members", "Non BOM ID"]] as const;

/** Everyone in the community: new sign-ups waiting to be activated, and every member's record. */
export default function AdminMembersPage() {
  return (
    <AdminSectionsPage title="Members" hint="Members waiting for activation, every member, and names in results without a BOM ID." sections={sections}>
      <SignupsSection />
      <PlayersSection />
      <NonMembersSection />
    </AdminSectionsPage>
  );
}
