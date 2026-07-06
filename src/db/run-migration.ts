/**
 * Applies all pending SQL migrations from the migrations folder.
 * Used for manual migrations that can't be applied interactively via drizzle-kit.
 */
import { loadEnvConfig } from "@next/env";
import { readFileSync } from "fs";
import { join } from "path";

loadEnvConfig(process.cwd());

async function runMigration() {
  const { db } = await import("./index");

  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error("Usage: tsx src/db/run-migration.ts <migration-file.sql>");
    process.exit(1);
  }

  const sqlPath = join(process.cwd(), "src/db/migrations", migrationFile);
  const sql = readFileSync(sqlPath, "utf-8");

  console.log(`Applying migration: ${migrationFile}`);
  await db.execute(sql as never);
  console.log("✅ Migration applied successfully");
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
