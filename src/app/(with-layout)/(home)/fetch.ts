import { db } from "@/db";
import { camp, family, aidProvider } from "@/db/schema";

export async function getDashboardStats() {
  try {
    const campsList = await db.select().from(camp);
    const familiesList = await db.select().from(family);
    const providersList = await db.select().from(aidProvider);

    // Sum of memberCount in family table
    const totalIndividuals = familiesList.reduce((acc, f) => acc + (f.memberCount || 1), 0);

    // Camps occupancy statistics
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
      };
    });

    // Camp distribution by Governorate
    const governorateStats = {
      north_gaza: campsList.filter(c => c.location === "north_gaza").length,
      gaza_city: campsList.filter(c => c.location === "gaza_city").length,
      middle_area: campsList.filter(c => c.location === "middle_area").length,
      khan_yunis: campsList.filter(c => c.location === "khan_yunis").length,
      rafah: campsList.filter(c => c.location === "rafah").length,
    };

    // Camp distribution by Need Level
    const needLevelStats = {
      low: campsList.filter(c => c.needLevel === "low").length,
      medium: campsList.filter(c => c.needLevel === "medium").length,
      high: campsList.filter(c => c.needLevel === "high").length,
      critical: campsList.filter(c => c.needLevel === "critical").length,
    };

    // Recent 5 registered families
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
      campOccupancy,
      governorateStats,
      needLevelStats,
      recentFamilies,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalCamps: 0,
      totalFamilies: 0,
      totalIndividuals: 0,
      totalProviders: 0,
      campOccupancy: [],
      governorateStats: { north_gaza: 0, gaza_city: 0, middle_area: 0, khan_yunis: 0, rafah: 0 },
      needLevelStats: { low: 0, medium: 0, high: 0, critical: 0 },
      recentFamilies: [],
    };
  }
}