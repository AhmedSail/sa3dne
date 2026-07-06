import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

// Load env before importing the db module, which reads DATABASE_URL at import time.
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("./index");
  const { user, account } = await import("./schema");
  const { hashPassword } = await import("better-auth/crypto");

  console.log("Seeding database...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sa3dne.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const adminName = process.env.SEED_ADMIN_NAME ?? "System Admin";

  // Check if user already exists
  const existingUsers = await db
    .select()
    .from(user)
    .where(eq(user.email, adminEmail));

  if (existingUsers.length > 0) {
    console.log(`ℹ️  Admin user already exists (${adminEmail}). Skipping seed.`);
    console.log("Seed complete.");
    return;
  }

  const hashedPassword = await hashPassword(adminPassword);
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const now = new Date();

  // Insert user
  await db.insert(user).values({
    id: userId,
    name: adminName,
    email: adminEmail,
    emailVerified: true,
    role: "admin",
    banned: false,
    createdAt: now,
    updatedAt: now,
  });

  // Insert account (credential provider) — userId must match the inserted user's id
  await db.insert(account).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✅ Admin user seeded:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role:     admin`);
  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
