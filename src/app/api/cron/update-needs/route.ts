import { NextResponse } from "next/server";
import { db } from "@/db";
import { camp } from "@/db/schema/camps";
import { aidContributionLine } from "@/db/schema/contributions";
import { AuditAction, logAudit } from "@/lib/audit";
import { inArray, eq } from "drizzle-orm";

/**
 * Recomputes every camp's need level. This endpoint writes to `camp` and to the
 * audit log, so it is a privileged operation and must never be callable by an
 * anonymous visitor. It is authenticated with a shared secret rather than a
 * session because the caller is a scheduler, not a user.
 */
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  if (!CRON_SECRET) {
    console.error("CRON_SECRET is not set; refusing to run the needs update.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allCamps = await db.select().from(camp);
    
    // Get all received/partially_received contribution lines
    const allLines = await db.select().from(aidContributionLine)
      .where(inArray(aidContributionLine.status, ["received", "partially_received"]));

    let updatedCount = 0;
    const now = new Date();

    for (const c of allCamps) {
      // Find the most recent receipt date for this camp
      const campLines = allLines.filter(line => line.campId === c.id && line.actualReceiptDate);
      
      // Default to camp creation date if no aid ever received, or fallback to now
      let lastAidDate = c.createdAt; 
      
      if (campLines.length > 0) {
        // Sort descending
        campLines.sort((a, b) => b.actualReceiptDate!.getTime() - a.actualReceiptDate!.getTime());
        lastAidDate = campLines[0].actualReceiptDate!;
      }

      // Calculate days elapsed
      const diffTime = Math.abs(now.getTime() - lastAidDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newNeedLevel: "low" | "medium" | "high" | "critical" = "low";
      if (diffDays > 30) {
        newNeedLevel = "critical";
      } else if (diffDays > 14) {
        newNeedLevel = "high";
      } else if (diffDays > 7) {
        newNeedLevel = "medium";
      } else {
        newNeedLevel = "low";
      }

      if (newNeedLevel !== c.needLevel) {
        await db.update(camp)
          .set({ needLevel: newNeedLevel, updatedAt: new Date() })
          .where(eq(camp.id, c.id));
        
        await logAudit({
          action: AuditAction.NEED_LEVEL_CHANGE,
          entityType: "camp",
          entityId: c.id,
          userId: "system", // Or null if your schema allows
          oldValue: { needLevel: c.needLevel },
          newValue: { needLevel: newNeedLevel, reason: "Automated cron based on last aid date" },
          request: req as any,
        });

        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${allCamps.length} camps. Updated ${updatedCount} camps.` 
    });

  } catch (error: any) {
    console.error("Cron update-needs failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
