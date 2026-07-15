import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { authorizationPlugins } from "./modules/authorization";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set.");
}

export const auth = betterAuth({
  appName: "Sa3dne",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        fieldName: "phone",
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  plugins: [
    ...authorizationPlugins,
  ],

  session: {
    deferSessionRefresh: true,
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL!,
    // Local dev fallbacks so auth mutations (e.g. sign-out) are not rejected
    // when the dev server picks a different port than the configured URL.
    "http://localhost:3000",
    "http://localhost:3001",
  ],
});
