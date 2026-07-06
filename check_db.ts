import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function run() {
  const { db } = await import("./src/db/index");
  const res = await db.execute(`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'role'`);
  console.log(res);
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
