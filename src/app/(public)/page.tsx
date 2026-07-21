import { db } from "@/db";
import { camp, family, aidContribution } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import LandingClient from "./_components/LandingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الرئيسية",
  description:
    "نظام متكامل لإدارة المخيمات وتتبع المساعدات الإنسانية وضمان الشفافية والمساءلة.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let stats = { totalCamps: 0, totalFamilies: 0, totalIndividuals: 0, totalContributions: 0 };

  try {
    const [campsResult, familiesResult, contribResult] = await Promise.all([
      db.select({ count: count() }).from(camp),
      db
        .select({
          count: count(),
          individuals: sql<number>`coalesce(sum(${family.memberCount}), 0)`,
        })
        .from(family),
      db.select({ count: count() }).from(aidContribution),
    ]);

    stats = {
      totalCamps: campsResult[0]?.count ?? 0,
      totalFamilies: familiesResult[0]?.count ?? 0,
      totalIndividuals: Number(familiesResult[0]?.individuals ?? 0),
      totalContributions: contribResult[0]?.count ?? 0,
    };
  } catch (_e) {
    // return zeros on DB error
  }

  return <LandingClient stats={stats} />;
}
