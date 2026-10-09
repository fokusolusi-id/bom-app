import { AdminSectionsPage } from "@/components/admin/admin-page";
import { PlayersSection } from "./players-section";
import { SignupsSection } from "./signups-section";

export const metadata = { title: "Members | Admin BOM" };

const sections = [["sign-ups", "Sign-ups"], ["players", "Players"]] as const;

/** Everyone in the community: new sign-ups waiting to be activated, and every player's record. */
export default function AdminMembersPage() {
  return (
    <AdminSectionsPage title="Members" hint="New sign-ups and every player." sections={sections}>
      <SignupsSection />
      <PlayersSection />
    </AdminSectionsPage>
  );
}
