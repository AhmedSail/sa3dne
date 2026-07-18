const { db } = require('./src/db');
const { user } = require('./src/db/schema/auth');

async function main() {
  const users = await db.select().from(user);
  console.log(users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}
main();
