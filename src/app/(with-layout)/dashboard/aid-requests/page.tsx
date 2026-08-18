import { guardPage } from "@/lib/auth/guard";
import { db } from "@/db";
import { camp, aidType } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import CampRequestsManager from "@/components/AidRequests/CampRequestsManager";
import AidRequestsList from "@/components/AidRequests/AidRequestsList";

export const dynamic = "force-dynamic";

export default async function AidRequestsPage() {
  const { campIds } = await guardPage("aidRequest", "read");

  // A camp-scoped caller manages its own requests; everyone else with
  // `aidRequest.read` is on the answering side and sees the open queue.
  const isCampManager = campIds !== null;

  if (isCampManager) {
    const assignedIds = campIds;
    if (assignedIds.length === 0) {
      return (
        <div className="p-8 text-center text-dark-4 dark:text-dark-6">
          You are not assigned to any camps yet.
        </div>
      );
    }

    const assignedCamps = await db
      .select({ id: camp.id, name: camp.name })
      .from(camp)
      .where(inArray(camp.id, assignedIds));

    const aidTypes = await db
      .select({ id: aidType.id, name: aidType.name, defaultUnit: aidType.defaultUnit })
      .from(aidType)
      .where(eq(aidType.status, "active"));

    return (
      <CampRequestsManager
        assignedCamps={assignedCamps}
        aidTypes={aidTypes}
      />
    );
  }

  // Provider / Admin view
  return <AidRequestsList />;
}
