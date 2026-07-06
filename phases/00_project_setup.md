# Phase 00 - Project Setup and Architecture

# Objective
Use the NextAdmin dashboard template as the base application, then configure Neon PostgreSQL 18, Drizzle ORM, TypeScript conventions, database connection, and development rules.

## Scope
- Start from the NextAdmin dashboard template project instead of creating a dashboard from scratch.
- Review the template structure, routes, layouts, components, sidebar, theme, and authentication examples.
- Configure TypeScript strict mode.
- Configure Tailwind CSS.
- Configure Drizzle ORM.
- Configure Neon PostgreSQL 18 connection.
- Add `drizzle.config.ts`.
- Add environment variables.
- Reuse and adapt the existing NextAdmin layout and dashboard shell.
- Reuse NextAdmin UI primitives and add new reusable components only when needed.
- Add basic health check endpoint.
- Add project-level constants and enums.
- Add seed script placeholder.

## Recommended Packages
- drizzle-orm
- drizzle-kit `^0.31.7`
- postgres or @neondatabase/serverless
- zod
- bcryptjs or argon2
- next-auth or jose depending auth implementation
- react-hook-form
- @hookform/resolvers
- date-fns
- lucide-react
- clsx / tailwind-merge
- tsx

## Suggested Install Commands
```bash
npm install drizzle-orm postgres zod
npm install -D drizzle-kit@^0.31.7 tsx
```

## Required Files
- `.env.example`
- `drizzle.config.ts`
- `src/db/index.ts`
- `src/db/schema/index.ts`
- `src/db/seed.ts`
- `src/lib/utils.ts`
- `src/lib/constants.ts`
- `src/app/api/health/route.ts`
- Existing NextAdmin layout/page files adapted as needed
- `src/app/api/health/route.ts`

## Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## Database
Create only initial Drizzle setup and enum planning if preferred.
Do not create all business tables yet unless needed for type planning.

## Package Scripts
```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx src/db/seed.ts"
}
```

## Acceptance Criteria
- App runs locally.
- Neon PostgreSQL 18 connection works.
- Drizzle can connect to the database.
- `drizzle-kit generate` works.
- `/api/health` returns OK.
- Tailwind styles are active.
- `.env.example` clearly lists `DATABASE_URL`, auth secrets, and app URL.


## NextAdmin Integration Requirements
- Preserve the template's existing dashboard shell.
- Add IDP Camp Management navigation items to the sidebar.
- Remove or hide demo pages only when they are not useful.
- Replace demo cards/tables/charts gradually with real project data in later phases.
- Do not break dark mode or responsive layout.
- Keep the template's folder conventions unless a small restructuring is clearly beneficial.
