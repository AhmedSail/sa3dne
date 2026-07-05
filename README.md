# Unified IDP Camp Management System - English Phase Package

This package is ready to be copied into the root of the NextAdmin project.

## Stack
- Next.js Full Stack
- NextAdmin dashboard template
- TypeScript
- Neon PostgreSQL 18
- Drizzle ORM
- drizzle-kit `^0.31.7`
- Zod
- Tailwind CSS

## Files
```txt
CLAUDE.md
.claude/
  PROJECT_CONTEXT.md
phases/
  00_project_setup.md
  01_auth_users.md
  02_camps_families_master_data.md
  03_aid_contributions_receipts.md
  04_complaints_public_tracking.md
  05_dashboards_reports_needs.md
  06_audit_notifications_hardening.md
README.md
PHASE_ORDER.md
```

## How to Use
Copy all files and folders into the main root folder of your NextAdmin repository.

Claude should automatically detect `CLAUDE.md` from the repo root.

Then ask:

```txt
Read CLAUDE.md and implement phases/00_project_setup.md
```

Continue phase by phase according to `PHASE_ORDER.md`.

## Critical Rule
Aid is managed at camp level only. Do not implement family-level aid distribution.
