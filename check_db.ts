import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function run() {
  const { db } = await import("./src/db/index");
  const { user } = await import("./src/db/schema");
  const res = await db.select().from(user);
  console.log(JSON.stringify(res, null, 2));
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
