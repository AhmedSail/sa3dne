/**
 * Global test setup.
 *
 * `src/db/index.ts` and `src/lib/auth/auth.ts` both throw at import time when
 * their environment variables are missing. Tests never talk to a real database
 * or a real auth server — both modules are mocked per suite — but the env vars
 * must still exist so that any transitive import resolves.
 */
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-not-used-for-real-signing";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
