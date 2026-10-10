import { AdminSectionsPage } from "@/components/admin/admin-page";
import { PlayersSection } from "./players-section";
import { SignupsSection } from "./signups-section";

export const metadata = { title: "Members | Admin BOM" };

const sections = [["sign-ups", "Waiting for activation"], ["members", "Members"]] as const;

/** Everyone in the community: new sign-ups waiting to be activated, and every member's record. */
export default function AdminMembersPage() {
  return (
    <AdminSectionsPage title="Members" hint="Members waiting for activation, and every member." sections={sections}>
      <SignupsSection />
      <PlayersSection />
    </AdminSectionsPage>
  );
}
