import { db } from "./src/db";
import { user } from "./src/db/schema/auth";

async function main() {
  const users = await db.select().from(user);
  console.log(users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}
main();
