import { auth } from "@/lib/auth";
import { getAssignedCampIds } from "@/lib/contributions/access";
import { db } from "@/db";
import { camp, aidType } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CampRequestsManager from "@/components/AidRequests/CampRequestsManager";
import AidRequestsList from "@/components/AidRequests/AidRequestsList";

export const dynamic = "force-dynamic";

export default async function AidRequestsPage() {
  const session = (await auth.api.getSession({ headers: await headers() })) as any;
  if (!session) {
    redirect("/auth/sign-in");
  }

  const role = session.user.role;
  const isCampManager = role === "camp_manager";
  
  // If admin, they can see both theoretically, but typically admin acts as a global overseer.
  // We'll show the AidRequestsList (provider view) to admins and providers.
  // We'll show the CampRequestsManager to camp managers.

  if (isCampManager) {
    const assignedIds = await getAssignedCampIds(session.user.id);
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
