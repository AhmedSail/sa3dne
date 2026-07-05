import { loadEnvConfig } from "@next/env";

// Load env before importing the db module, which reads DATABASE_URL at import time.
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("./index");

  console.log("Seeding database...");

  // Placeholder: real seed data (demo camps, users, aid types, etc.) is added
  // in later phases. Kept as a no-op so `pnpm db:seed` runs cleanly today.
  void db;

  console.log("Seed complete. No demo data defined yet.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
