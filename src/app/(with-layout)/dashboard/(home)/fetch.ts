import { db } from "@/db";
import { camp, family, aidProvider } from "@/db/schema";
import { complaints } from "@/db/schema/complaints";
import { aidContribution } from "@/db/schema/contributions";
import { campAssignment } from "@/db/schema/camps";
import { eq, sql } from "drizzle-orm";

export async function getDashboardStats() {
  try {
    const campsList = await db.select().from(camp);
    const familiesList = await db.select().from(family);
    const providersList = await db.select().from(aidProvider);
    const complaintsList = await db.select().from(complaints);
    const contributionsList = await db.select().from(aidContribution);

    const totalIndividuals = familiesList.reduce((acc, f) => acc + (f.memberCount || 1), 0);

    const campOccupancy = campsList.map((c) => {
      const familiesInCamp = familiesList.filter((f) => f.campId === c.id).length;
      const occupancyRate = c.capacity > 0 ? Math.round((familiesInCamp / c.capacity) * 100) : 0;
      return {
        id: c.id,
        name: c.name,
        location: c.location,
        capacity: c.capacity,
        familiesCount: familiesInCamp,
        occupancyRate,
        needLevel: c.needLevel,
        operationalStatus: c.operationalStatus,
      };
    });

    const governorateStats = {
      north_gaza: campsList.filter(c => c.location === "north_gaza").length,
      gaza_city: campsList.filter(c => c.location === "gaza_city").length,
      middle_area: campsList.filter(c => c.location === "middle_area").length,
      khan_yunis: campsList.filter(c => c.location === "khan_yunis").length,
      rafah: campsList.filter(c => c.location === "rafah").length,
    };

    const needLevelStats = {
      low: campsList.filter(c => c.needLevel === "low").length,
      medium: campsList.filter(c => c.needLevel === "medium").length,
      high: campsList.filter(c => c.needLevel === "high").length,
      critical: campsList.filter(c => c.needLevel === "critical").length,
    };

    const complaintsByStatus = {
      pending: complaintsList.filter(c => c.status === "pending").length,
      in_review: complaintsList.filter(c => c.status === "in_review").length,
      resolved: complaintsList.filter(c => c.status === "resolved").length,
      rejected: complaintsList.filter(c => c.status === "rejected").length,
    };

    const recentFamilies = [...familiesList]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(f => {
        const campName = campsList.find(c => c.id === f.campId)?.name || "Unknown";
        return {
          id: f.id,
          headName: f.headName,
          nationalId: f.nationalId,
          memberCount: f.memberCount,
          campName,
          createdAt: f.createdAt,
        };
      });

    return {
      totalCamps: campsList.length,
      totalFamilies: familiesList.length,
      totalIndividuals,
      totalProviders: providersList.length,
      totalComplaints: complaintsList.length,
      pendingComplaints: complaintsByStatus.pending,
      totalContributions: contributionsList.length,
      campOccupancy,
      governorateStats,
      needLevelStats,
      complaintsByStatus,
      recentFamilies,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalCamps: 0,
      totalFamilies: 0,
      totalIndividuals: 0,
      totalProviders: 0,
      totalComplaints: 0,
      pendingComplaints: 0,
      totalContributions: 0,
      campOccupancy: [],
      governorateStats: { north_gaza: 0, gaza_city: 0, middle_area: 0, khan_yunis: 0, rafah: 0 },
      needLevelStats: { low: 0, medium: 0, high: 0, critical: 0 },
      complaintsByStatus: { pending: 0, in_review: 0, resolved: 0, rejected: 0 },
      recentFamilies: [],
    };
  }
}

export async function getCampManagerStats(userId: string) {
  try {
    const assignments = await db.select().from(campAssignment).where(eq(campAssignment.userId, userId));
    const campIds = assignments.map(a => a.campId);

    if (campIds.length === 0) {
      return { campIds: [], camps: [], totalFamilies: 0, totalIndividuals: 0, pendingComplaints: 0, totalComplaints: 0 };
    }

    const campsList = await db.select().from(camp).where(
      sql`${camp.id} = ANY(ARRAY[${sql.raw(campIds.map(id => `'${id}'`).join(","))}]::text[])`
    );
    const familiesList = await db.select().from(family).where(
      sql`${family.campId} = ANY(ARRAY[${sql.raw(campIds.map(id => `'${id}'`).join(","))}]::text[])`
    );
    const complaintsList = await db.select().from(complaints).where(
      sql`${complaints.campId} = ANY(ARRAY[${sql.raw(campIds.map(id => `'${id}'`).join(","))}]::text[])`
    );

    const totalIndividuals = familiesList.reduce((acc, f) => acc + (f.memberCount || 1), 0);

    const campsWithStats = campsList.map(c => ({
      ...c,
      familiesCount: familiesList.filter(f => f.campId === c.id).length,
      complaintsCount: complaintsList.filter(comp => comp.campId === c.id).length,
      pendingComplaints: complaintsList.filter(comp => comp.campId === c.id && comp.status === "pending").length,
    }));

    return {
      campIds,
      camps: campsWithStats,
      totalFamilies: familiesList.length,
      totalIndividuals,
      pendingComplaints: complaintsList.filter(c => c.status === "pending").length,
      totalComplaints: complaintsList.length,
    };
  } catch (error) {
    console.error("Failed to fetch camp manager stats:", error);
    return { campIds: [], camps: [], totalFamilies: 0, totalIndividuals: 0, pendingComplaints: 0, totalComplaints: 0 };
  }
}

export async function getProviderStats(userId: string) {
  try {
    const providers = await db.select().from(aidProvider);
    const myProvider = providers.find(p => (p as any).linkedUserId === userId);

    if (!myProvider) {
      return { hasProvider: false, contributions: [], totalDraft: 0, totalSubmitted: 0, totalCancelled: 0 };
    }

    const contribs = await db.select().from(aidContribution).where(
      eq(aidContribution.providerId, myProvider.id)
    );

    return {
      hasProvider: true,
      providerId: myProvider.id,
      providerName: myProvider.name,
      contributions: contribs,
      totalDraft: contribs.filter(c => c.status === "draft").length,
      totalSubmitted: contribs.filter(c => c.status === "submitted").length,
      totalCancelled: contribs.filter(c => c.status === "cancelled").length,
    };
  } catch (error) {
    console.error("Failed to fetch provider stats:", error);
    return { hasProvider: false, contributions: [], totalDraft: 0, totalSubmitted: 0, totalCancelled: 0 };
  }
}