import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { authorizationPlugins } from "./modules/authorization";
import { AuditAction, logAudit } from "@/lib/audit";

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

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              emailVerified: true,
            },
          };
        },
      },
    },
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  plugins: [
    ...authorizationPlugins,
  ],

  hooks: {
    // Record a password change in the audit log WITHOUT any password values.
    // Best-effort: never let an audit failure break the auth flow.
    after: createAuthMiddleware(async (ctx) => {
      try {
        if (ctx.path !== "/change-password") return;
        const context = ctx.context as {
          session?: { user?: { id?: string } };
          newSession?: { user?: { id?: string } };
        };
        const userId =
          context.session?.user?.id ?? context.newSession?.user?.id ?? null;
        if (!userId) return;
        const headerBag = ctx.headers ?? ctx.request?.headers;
        await logAudit({
          userId,
          action: AuditAction.USER_PASSWORD_CHANGE,
          entityType: "user",
          entityId: userId,
          // Intentionally no old/new value — password values must never be stored.
          request: headerBag ? { headers: headerBag } : undefined,
        });
      } catch (error) {
        console.error("Password-change audit hook failed", error);
      }
    }),
  },

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
