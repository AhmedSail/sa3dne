# Unified IDP Camp Management System — Project Report

**University of Palestine — Faculty of Applied Engineering**

**Project Report**

| Name | Role |
|---|---|
| Ahmad Abu Abada | Full Stack Developer |
| Ahmad Al Qoumboz | Full Stack Developer |

**Supervisor:** Dr. [Supervisor Name]

**Date:** July 2026

---

## 1. Project Introduction

During humanitarian crises and the mass displacement of civilians, aid organizations and camp administrations face major difficulties in organizing camps, tracking incoming aid, and responding to the needs and complaints of displaced people. Many camps still rely on manual paper records and scattered spreadsheets to manage families, aid providers, and aid contributions, which leads to duplicated effort, lost information, unfair distribution, and a lack of accountability.

To solve these problems, we developed the **Unified IDP Camp Management System**, a full-stack web application that provides a single, centralized platform for managing internally displaced persons (IDP) camps, camp-level aid contributions, receipt confirmations, complaints, and reports.

The main goal of this project is to create a centralized and secure system that manages the most important operations of humanitarian camp administration, including:

- Camp management and camp manager assignment.
- Family registration for statistics and population reporting.
- Aid type and aid provider management.
- Camp-level aid contributions from organizations and independent initiators.
- Line-by-line receipt confirmation by camp managers.
- Public complaints, suggestions, and unmet-need submissions with tracking.
- Role-based dashboards, reports, and manual camp need classification.
- Audit logs and in-app notifications for accountability.

### Non-Negotiable Business Rule

A defining principle of this system is that **aid is managed at the camp level only**. The system does **not** implement family-level or individual-level aid distribution. Families are registered strictly for statistics and population reporting. This keeps the workflow realistic, prevents fraud at the individual level, and matches how humanitarian aid is actually delivered to camps.

During the development of this project, we used the **Next.js** full-stack framework with the **App Router**, **Neon PostgreSQL 18** as the database, **Drizzle ORM** for type-safe data access, and the **NextAdmin** dashboard template as the user interface foundation.

---

## 2. Technologies Used

The main technologies used in the project are:

### Full Stack (Next.js)
- **TypeScript** (strict mode).
- **Next.js (App Router)** — full-stack framework handling routing, server components, Route Handlers, and Server Actions.
- **React 19** — user interface library.
- **Server-Side Authorization** — every protected query and mutation is authorized on the server, never trusting hidden frontend buttons.

### Authentication
- **Better Auth** — email + password authentication with the `admin` plugin for roles, ban/unban, and user management.

### Database
- **Neon PostgreSQL 18** — serverless PostgreSQL database.
- **Drizzle ORM** — type-safe schema definitions using `pgTable` and PostgreSQL column types.
- **drizzle-kit** — migration generation and application.
- **pg** — PostgreSQL driver.

### Validation
- **Zod** — request and form validation, kept separate from the Drizzle schema definitions.

### Frontend / UI
- **NextAdmin** dashboard template — reused shell, sidebar, header, dark mode, responsive layout, cards, tables, and forms.
- **Tailwind CSS** — utility-first styling.
- **ApexCharts / react-apexcharts** — dashboard and report charts.
- **next-themes** — light/dark theme support.
- **Sonner** — toast notifications.
- **Flatpickr** — date pickers for delivery and receipt dates.

---

## 3. Development Methodology and Team Communication

The project was built by two full-stack developers working in close collaboration. Because both developers work across the entire stack (database, backend, and frontend), the work was divided by **system phase** rather than by technical layer. This gave each developer full ownership of a set of end-to-end phases — from the Drizzle schema, through the server-side services and permission checks, up to the NextAdmin user interface.

The phases were distributed between the two developers as follows:

- **Phase 0 (Project Setup and Architecture)** was carried out by **both developers together**, since it defines the shared foundation (template, database connection, ORM setup, enums, and navigation) that every later phase builds on.
- **Ahmad Al Qoumboz** owned the **odd phases: 1, 3, and 5**.
- **Ahmad Abu Abada** owned the **even phases: 2, 4, and 6**.

This alternating split was deliberate: it kept each developer touching the schema, the services, and the UI in every part of the system, and it interleaved their work so that neither developer's phases depended entirely on the other's.

Communication between the two developers was done through direct messaging and shared Git branches, where we discussed progress, distributed phases, and resolved technical problems. **Whenever one developer finished a phase, the other developer performed a full code review of that phase through a pull request** — reviewing the Drizzle schema changes, the server-side permission checks, the Zod validation, and the NextAdmin UI — before the branch was merged. This mutual review meant that every phase in the system was written by one developer and independently reviewed by the other, which kept the shared schema consistent and caught issues early.

The system was developed following a strict **phase-based methodology**. The project was divided into seven ordered phases, and for every phase we followed the same disciplined process:

1. Read the current phase requirements.
2. Propose and design the Drizzle schema/table changes first.
3. Implement the schema using `pgTable`, PostgreSQL types, and relations.
4. Generate migrations using `drizzle-kit`.
5. Implement backend services and server-side permission checks.
6. Implement the UI inside the existing NextAdmin structure.
7. Add Zod validation.
8. Add seed/demo data where useful.
9. Run lint, typecheck, and build.
10. Summarize what changed and what remained.

### Phase Order

| Order | Phase | Owner |
|---:|---|---|
| 0 | Project Setup and Architecture | Both developers |
| 1 | Authentication, Authorization, and User Management | Ahmad Al Qoumboz |
| 2 | Camps, Families, Aid Types, and Providers | Ahmad Abu Abada |
| 3 | Aid Contributions and Receipt Confirmation | Ahmad Al Qoumboz |
| 4 | Complaints, Suggestions, and Public Tracking | Ahmad Abu Abada |
| 5 | Dashboards, Reports, and Camp Need Classification | Ahmad Al Qoumboz |
| 6 | Audit Logs, Notifications, and Hardening | Ahmad Abu Abada |

All seven phases were completed, and the application runs successfully after every phase.

### Detailed Phase Breakdown

The following breakdown records, for each phase, its objective, the main work delivered, and the key acceptance criteria that had to pass before the phase was considered complete and merged.

#### Phase 0 — Project Setup and Architecture *(both developers)*

**Objective:** Use the NextAdmin dashboard template as the base application, then configure Neon PostgreSQL 18, Drizzle ORM, TypeScript conventions, the database connection, and the shared development rules.

**Delivered:**
- Started from the NextAdmin template instead of building a dashboard from scratch; reviewed its structure, routes, layouts, sidebar, theme, and auth examples.
- Configured TypeScript strict mode, Tailwind CSS, Drizzle ORM, and the Neon PostgreSQL 18 connection in `src/db/index.ts`.
- Added `drizzle.config.ts`, `.env.example` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`), the `src/db/schema/index.ts` barrel, a `seed.ts` placeholder, and shared `lib/utils.ts` / `lib/constants.ts`.
- Planned all domain enums in `src/db/schema/enums.ts` and added the `db:generate`, `db:migrate`, `db:studio`, and `db:seed` package scripts.
- Added a `/api/health` endpoint and adapted the sidebar navigation to the IDP Camp Management modules.

**Key acceptance criteria:** app runs locally, Neon connection works, `drizzle-kit generate` works, `/api/health` returns OK, Tailwind styles active, and dark mode / responsive layout preserved.

#### Phase 1 — Authentication, Authorization, and User Management *(Ahmad Al Qoumboz)*

**Objective:** Implement secure login, logout, role-based routing, server-side authorization, password changing, and admin user management using **Better Auth** (email + password only).

**Delivered:**
- `betterAuth()` with the Drizzle adapter and `admin()` plugin in `src/lib/auth.ts`, the client in `src/lib/auth-client.ts`, and the handler at `src/app/api/auth/[...all]/route.ts`.
- User model (Better Auth base + custom `phone` / `role`), plus Session, Account, and Verification tables.
- User status via Better Auth's `banned` field instead of a custom status column.
- `src/middleware.ts` protecting `/dashboard/*`, the login page, logout action, and the admin user-management pages (list, create, edit, ban/unban).
- Change-password flow with current-password validation, and an initial admin seeded via `seed.ts`.

**Key acceptance criteria:** active users reach the dashboard; invalid credentials show a generic error; banned accounts are blocked; logout invalidates the session; admin can create/edit/ban users; and the **last active admin cannot be banned**.

#### Phase 2 — Camps, Families, Aid Types, and Providers *(Ahmad Abu Abada)*

**Objective:** Implement the core master data needed before any aid workflow: camps, camp assignments, families for statistics, aid types, and aid providers.

**Delivered:**
- Camp CRUD, Camp Manager assignment, and deactivate/close flows.
- Family registration inside a camp (statistics only), edit, and deactivate-with-reason, plus the optional family-member breakdown.
- Aid Type CRUD with historical visibility after deactivation.
- Aid Provider CRUD linked to active user accounts, with a provider contribution-history page.
- Drizzle tables with `$inferSelect` / `$inferInsert` types, indexes, and foreign keys.

**Key acceptance criteria:** capacity 0 rejected; inactive-manager assignment rejected; closed camp not selectable for future aid; duplicate active national ID rejected; member count ≥ 1; duplicate active aid-type name rejected; and provider linking to an inactive user rejected.

#### Phase 3 — Aid Contributions and Receipt Confirmation *(Ahmad Al Qoumboz)*

**Objective:** Implement the main operational workflow — providers submit camp-level aid contributions and Camp Managers confirm receipt line by line.

**Delivered:**
- `AidContribution` header (`providerId`, `status`, `notes`, `submittedAt`, `createdById`) and `AidContributionLine` (`campId`, `aidTypeId`, planned/actual quantities, unit, delivery/receipt dates, status, confirmation notes, rejection reason).
- Draft → submit lifecycle, with drafts hidden from Camp Managers and only submitted lines becoming visible.
- Line-level receipt actions: full receipt, partial receipt, not received, and reject — each with its own server-side Zod rules.
- Provider tracking scoped to own contributions only.

**Key acceptance criteria:** user without an active provider profile cannot create a contribution; quantity 0 rejected; inactive camp/aid type not selectable; submit sets header `submitted` and lines `pending`; missing receipt date rejected; partial equal-to-planned and partial-zero rejected; not-received requires notes; reject requires reason; cross-provider access Forbidden.

#### Phase 4 — Complaints, Suggestions, and Public Tracking *(Ahmad Abu Abada)*

**Objective:** Let beneficiaries submit complaints, suggestions, or unmet needs without an account, and let authorized users review and update them.

**Delivered:**
- Public feedback form (`/feedback`) and public tracking page (`/track`) keyed by a unique tracking number.
- `Complaint` model (`trackingNumber`, `campId`, `type`, `beneficiaryName`, `phone`, `details`, `status`, `resolutionNotes`, `rejectionReason`, `reviewedById`, `reviewedAt`).
- Complaint list and detail for Admin and Camp Manager, with filters by camp, type, status, date, and keyword.
- Role-scoped access and status-update validation.

**Key acceptance criteria:** valid submission returns a tracking number; type and details required; invalid tracking number shows a no-result message; Camp Manager cannot review complaints in another camp; reject requires a reason; resolved requires resolution notes; empty filter results show an empty state.

#### Phase 5 — Dashboards, Reports, and Camp Need Classification *(Ahmad Al Qoumboz)*

**Objective:** Implement role-based dashboards, basic reports, and manual camp need classification.

**Delivered:**
- Admin dashboard (system-wide counts + contribution/complaint status breakdown charts).
- Camp Manager dashboard (assigned camps: families, individuals, incoming aid, pending confirmations, received aid, open complaints).
- Provider dashboard (own contributions: totals by camp, totals by aid type, confirmation status breakdown).
- Contribution and complaint reports with server-enforced scope and filters (date, camp, aid type, provider, status).
- Manual camp need-level update and a provider camp-needs view (camp-level data only).

**Key acceptance criteria:** non-admin cannot access the admin dashboard; Camp Manager sees assigned-camp data only (with an empty state when unassigned); provider sees own statistics only; reports enforce backend scope; invalid need level rejected; provider cannot see detailed family records and can filter camps by critical need.

#### Phase 6 — Audit Logs, Notifications, and Hardening *(Ahmad Abu Abada)*

**Objective:** Add accountability, notifications, final security hardening, QA fixes, and production readiness.

**Delivered:**
- `AuditLog` model (`userId`, `action`, `entityType`, `entityId`, `oldValueJson`, `newValueJson`, `ipAddress`, `userAgent`) and a central audit-logging service covering user, camp, family, aid-type, provider, contribution, receipt-confirmation, complaint, and need-level actions.
- `Notification` model (`userId`, `title`, `message`, `entityType`, `entityId`, `link`, `status`, `readAt`) with submit/receipt notifications and mark-as-read.
- Final security, permission, and validation review, error handling, UX polish, and production build fixes.

**Key acceptance criteria:** contribution submission creates an audit log; password-change logs never store password values; non-admin cannot view audit logs; Camp Managers receive unread notifications for new submitted aid (multi-camp lines notify each manager); providers are notified on receipt confirmation; notification links open the relevant record; and the final production build passes.

---

## 4. System Actors and Roles

The system was designed around five actors, whose permissions are enforced strictly on the server:

1. **System Administrator** — can access all system data, manage users, camps, providers, aid types, reports, and audit logs.
2. **Camp Manager** — can access only the camps assigned to them: their families, incoming aid, receipt confirmation, complaints, reports, and notifications.
3. **Humanitarian Organization Representative** — a provider who manages their own organization profile and contributions and views camp needs.
4. **Independent Aid Initiator** — a provider similar to the organization representative, linked to an independent-initiator profile.
5. **Beneficiary / Displaced Person** — a public user with no account; can submit and track complaints, suggestions, and unmet needs through public forms only.

### Role-Based Sidebar Visibility

- **System Administrator:** all modules.
- **Camp Manager:** assigned camp dashboard, families, incoming aid, complaints, reports, notifications.
- **Organization Representative / Independent Initiator:** provider dashboard, my contributions, camp needs, notifications.

---

## 5. System Development Overview

The system was developed gradually through cooperation between the two developers. Development started with **Phase 0**, which both developers built together: configuring the base NextAdmin template, the Neon PostgreSQL connection, and the Drizzle ORM setup. From that shared foundation, the remaining six phases were split between the two developers, who alternated ownership across the phase order:

- **Ahmad Al Qoumboz — Odd Phases (1, 3, 5):** authentication, authorization, and user management; aid contributions and receipt confirmation; and the dashboards, reports, and camp need classification.
- **Ahmad Abu Abada — Even Phases (2, 4, 6):** the master-data modules (camps, families, aid types, providers); complaints and public tracking; and the audit-log, notification, and hardening layer.

Because ownership alternated phase by phase, both developers continuously worked on the same Drizzle schema and the same NextAdmin application shell. Each developer reviewed the other's completed phase through a pull request before it was merged, so the database design and the reusable UI components stayed consistent across the whole project.

---

## 6. Team Member 1: Ahmad Abu Abada — Full Stack Developer

### Role Description

Ahmad Abu Abada owned the **even phases (2, 4, 6)** of the Unified IDP Camp Management System, and worked together with Ahmad Al Qoumboz on the shared **Phase 0** foundation. His phases covered the master-data modules that every workflow depends on, the public complaints and tracking module, and the final audit-log, notification, and hardening layer.

As a full-stack developer, he owned each of his phases end to end: designing the Drizzle schema, generating migrations, implementing server-side services and permission checks, and building the user interface inside the existing NextAdmin structure. He also **reviewed Ahmad Al Qoumboz's phases (1, 3, and 5)** through pull requests before they were merged.

### Tasks Completed by Ahmad Abu Abada

#### 1. Project Setup and Architecture (Phase 0 — with Ahmad Al Qoumboz)

Together with Ahmad Al Qoumboz, Ahmad set up the base application using the **NextAdmin** dashboard template instead of building a dashboard from scratch. This preserved the template's existing layout, sidebar, header, dark mode, responsive behavior, cards, tables, forms, and chart components. The two developers jointly configured the technical foundation:

- Configured **TypeScript strict mode** and **Tailwind CSS**.
- Configured **Drizzle ORM** and the **Neon PostgreSQL 18** connection in `src/db/index.ts`.
- Added `drizzle.config.ts` and the environment variable structure (`.env.example` with `DATABASE_URL`, auth secrets, and app URL).
- Added a **health check** endpoint at `/api/health` to verify the database connection.
- Planned all **domain enums** in `src/db/schema/enums.ts`, including user roles, Gaza governorates, camp status, need level, provider type, contribution status, contribution line status, complaint type, complaint status, and notification status.
- Added the package scripts for `db:generate`, `db:migrate`, `db:push`, `db:studio`, and `db:seed`.
- Adapted the NextAdmin sidebar navigation to the IDP Camp Management modules.

#### 2. Camps, Families, Aid Types, and Providers (Phase 2)

Ahmad implemented the master-data modules that every later workflow depends on. He designed the Drizzle schema for each entity, exported select/insert types with `$inferSelect` and `$inferInsert`, and added the necessary indexes and foreign keys.

**Camps.** Full CRUD for camps with fields for name, location (Gaza governorate), capacity, operational status, need level, and notes. He enforced the business rules that **capacity must be greater than zero**, that inactive/closed camps cannot receive new contributions, and that a **Camp Manager can manage only assigned camps**. He also built the **camp assignment** feature that links active Camp Managers to camps (rejecting inactive managers), and the deactivate/close camp flow.

**Families.** Family registration inside a camp **for statistics only**, with head name, national ID, phone, member count, occupation, notes, and status — plus an optional **family-member** breakdown (name, relationship, education level, gender, birth date) for richer population statistics. He enforced that the **national ID must be unique for active records**, that **member count must be at least 1**, and that families are deactivated with a reason rather than physically deleted. Crucially, families carry **no aid entitlement** — they exist only for population reporting.

**Aid Types.** CRUD for aid types with name, category, and default unit. Active aid type names must be unique, and deactivated aid types remain visible in historical records but are no longer selectable.

**Aid Providers.** CRUD for providers (organization or independent initiator), each linked to an **active user account**. Organization Representatives link to organization providers and Independent Aid Initiators link to independent-initiator providers, with a provider contribution history page.

#### 3. Complaints, Suggestions, and Public Tracking (Phase 4)

Ahmad built the **public feedback** module that lets displaced people communicate without an account:

- A **public feedback form** (`/feedback`) where a beneficiary submits a complaint, suggestion, or unmet need — with no login required.
- A unique **tracking number** generated for each submission, and a **public tracking page** (`/track`) that shows only safe status information for a given tracking number, with a clear no-result message for invalid numbers.
- A **complaint list and detail** view for Admins and Camp Managers, with filters by camp, type, status, date, and keyword.
- **Role-scoped access:** Camp Managers can review complaints only for their assigned camps, while the System Administrator can review all complaints — and filters never expose unauthorized camp data.
- Status updates with validation: **rejected complaints require a rejection reason** and **resolved complaints require resolution notes**.

#### 4. Audit Logs, Notifications, and Hardening (Phase 6)

Ahmad added the accountability and production-readiness layer:

**Audit logging.** He implemented an **AuditLog** model and a central audit-logging service that records important actions — user, camp, family, aid type, provider, contribution, receipt-confirmation, complaint, and need-level changes — storing old/new value snapshots, IP address, and user agent. **Password values are never stored in audit logs.** Only the System Administrator can view the audit log, which supports filtering by action.

**Notifications.** He implemented a **Notification** model and in-app notifications:
- When a provider submits aid for a camp, the assigned **Camp Manager receives an unread notification** (and, optionally, the System Administrator if the camp has no manager). Contributions with multiple camp lines notify each relevant manager.
- When a line is received, partially received, not received, or rejected, the **provider receives a notification**.
- Notification links open the relevant record, and users can **mark notifications as read**.

**Hardening.** He led the final security review, permission review, validation review, UX polish, error handling, and production build fixes to make the application deployment-ready.

### Collaboration

Ahmad worked closely with Ahmad Al Qoumboz to keep the shared Drizzle schema consistent, to make sure the complaint and audit hooks were wired into the workflows built in Ahmad Al Qoumboz's phases, and to keep the NextAdmin components and styling consistent. He also reviewed each of Ahmad Al Qoumboz's phases (1, 3, 5) through pull requests before merge.

---

## 7. Team Member 2: Ahmad Al Qoumboz — Full Stack Developer

### Role Description

Ahmad Al Qoumboz owned the **odd phases (1, 3, 5)** of the system, and worked together with Ahmad Abu Abada on the shared **Phase 0** foundation. His phases covered the security backbone of the application, the main operational aid-contribution and receipt-confirmation workflow, and the role-based dashboards, reports, and camp need classification.

Like the first developer, he owned each phase end to end: designing the Drizzle schema, generating migrations, implementing server-side services with strict scope checks, and building the user interface inside the NextAdmin structure. He also **reviewed Ahmad Abu Abada's phases (2, 4, and 6)** through pull requests before they were merged.

### Tasks Completed by Ahmad Al Qoumboz

#### 1. Authentication, Authorization, and User Management (Phase 1)

Ahmad implemented the security backbone of the system using **Better Auth** with email + password authentication and the **admin plugin**:

- Configured `betterAuth()` with the Drizzle adapter and `admin()` plugin in `src/lib/auth.ts`, and the matching client in `src/lib/auth-client.ts`.
- Generated the **User**, **Session**, **Account**, and **Verification** tables, extending the user with custom fields such as `phone` and `role`.
- Implemented user status through Better Auth's **ban/unban** mechanism (banned users cannot log in) instead of a custom status column.
- Built the **login page**, **logout** action, and **middleware** to protect the `/dashboard/*` routes and enforce server-side session checks.
- Built the **admin user management** UI: user list, create user, edit user (name, phone, role), and ban/unban.
- Implemented the safeguard that **prevents deactivating the last active administrator**.
- Implemented the **change password** flow with current-password validation.
- Seeded an initial administrator account via `seed.ts`.

**Authorization guarantee:** unauthenticated users are redirected or rejected, authenticated users without permission receive a Forbidden response, and all authorization is enforced on the server — never through hidden frontend buttons alone.

#### 2. Aid Contributions and Receipt Confirmation (Phase 3)

This is the main operational workflow of the system. Ahmad designed two core tables, **AidContribution** (header) and **AidContributionLine** (per-camp lines), and implemented the full lifecycle:

**Provider side.**
- Providers create a **draft contribution** and add one or more **contribution lines**, each for a single camp with an aid type, planned quantity, unit, and planned delivery date.
- Enforced that **quantity must be greater than zero**, and that **inactive camps and inactive aid types cannot be selected**.
- A submitted contribution must contain **at least one valid line**; on submit, the contribution status becomes `submitted` and each line becomes `pending`.
- Providers can track the status of **their own contributions only** — cross-provider access returns Forbidden. Users without an active provider profile cannot create contributions.

**Camp Manager side.**
- Camp Managers see **incoming aid only for their assigned camps** — draft contributions are never visible to them.
- Confirmation happens at the **line level**, not the header level. For each line the manager can:
  - **Confirm full receipt** — actual quantity equals planned quantity, requires a receipt date.
  - **Confirm partial receipt** — actual quantity greater than 0 and less than planned, requires notes.
  - **Mark not received** — requires notes, actual quantity must be 0/empty.
  - **Reject the line** — requires a rejection reason.

Every rule (missing receipt date rejected, partial-equal-to-planned rejected, partial-zero rejected, not-received requires notes, reject requires reason) is validated on the server with Zod.

#### 3. Dashboards, Reports, and Camp Need Classification (Phase 5)

Ahmad built the full role-based dashboard and reporting layer using NextAdmin's existing cards, tables, and chart components:

**System Administrator dashboard and reports.**
- System-wide metrics: camp count, family count, individual count, provider count, contribution count, and complaint count.
- Contribution status breakdown and complaint status breakdown charts.
- **Contribution and complaint reports** with server-enforced access scope and filters by date, camp, aid type, provider, and status, with clear empty states when a filter returns no data.

**Camp Manager and Provider dashboards.**
- **Camp Manager dashboard** scoped to assigned camps: families and individuals, incoming aid, pending confirmations, received aid, and open complaints — with a clear empty state for a manager who has no assigned camp.
- **Provider dashboard** scoped to the provider's own contributions: totals by camp, totals by aid type, and confirmation status breakdown.

**Camp need classification.**
- **Manual camp need level** update (low / medium / high / critical) with validation that rejects invalid levels.
- A **camp needs view** for providers that exposes camp-level need data only — never detailed family records — and lets providers filter camps by critical need.

### Collaboration

Ahmad Al Qoumboz coordinated continuously with Ahmad Abu Abada to make sure the contribution and dashboard workflows respected the camp-assignment and provider-linking rules defined in the master-data phase, and that the reporting layer consumed exactly the data the earlier phases exposed. He also reviewed each of Ahmad Abu Abada's phases (2, 4, 6) through pull requests before merge.

---

## 8. Database Design

The database is **Neon PostgreSQL 18**, accessed exclusively through **Drizzle ORM** (no Prisma, no MySQL syntax). All schema definitions live in `src/db/schema`, the connection lives in `src/db/index.ts`, and every schema change is captured by a `drizzle-kit`-generated migration.

### Main Entities

| Entity | Purpose |
|---|---|
| User / Session / Account / Verification | Authentication and roles (Better Auth). |
| Camp | Camp master data, capacity, operational status, need level. |
| CampAssignment | Links Camp Managers to the camps they manage. |
| Family | Family registration for statistics only (no aid entitlement). |
| AidType | Categories of aid and their default units. |
| AidProvider | Organizations and independent initiators, linked to user accounts. |
| AidContribution | Contribution header submitted by a provider. |
| AidContributionLine | Per-camp aid line with planned and actual quantities and status. |
| Complaint | Public complaints, suggestions, and unmet needs with tracking. |
| AuditLog | Accountability record of important system actions. |
| Notification | In-app notifications for managers and providers. |

### Detail of the Main Tables and Their Columns

The following tables describe the columns of the core entities as they are defined in `src/db/schema`. All primary keys are `text` IDs, and every table carries `created_at` / `updated_at` timestamps unless noted.

**`user`** — authentication and roles (Better Auth, extended with custom fields).

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `name` | text, not null | Full name. |
| `email` | text, not null, **unique** | Login email. |
| `email_verified` | boolean, default `false` | Email verification flag. |
| `image` | text | Optional avatar URL. |
| `phone` | text | Custom field. |
| `role` | `user_role` enum, default `user` | Drives all authorization. |
| `banned` / `ban_reason` / `ban_expires` | boolean / text / timestamp | User status via Better Auth ban mechanism. |

Companion Better Auth tables **`session`** (`token`, `expires_at`, `ip_address`, `user_agent`, `user_id`), **`account`** (credential/OAuth data, including the hashed `password`), and **`verification`** (`identifier`, `value`, `expires_at`) complete the auth model.

**`camp`** — camp master data.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `name` | text, not null | Camp name. |
| `location` | `gaza_governorate` enum, default `gaza_city` | One of the five Gaza governorates. |
| `capacity` | integer, not null | Must be greater than zero (enforced in service/Zod). |
| `operational_status` | `camp_status` enum, default `active` | `active` / `inactive` / `closed`. |
| `need_level` | `need_level` enum, default `low` | Manually classified need. |
| `notes` | text | Free-text notes. |
| `status` | text, default `active` | Record status (`active` / `inactive`). |

**`camp_assignment`** — links Camp Managers to camps (many-to-many join).

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `camp_id` | text, not null, FK → `camp.id` | On delete cascade. |
| `user_id` | text, not null, FK → `user.id` | On delete cascade. |

**`family`** — family registration for statistics only (no aid entitlement).

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `camp_id` | text, not null, FK → `camp.id` | Owning camp (cascade delete). |
| `head_name` | text, not null | Head of household. |
| `national_id` | text, not null | Unique for active families. |
| `phone` | text | Optional contact. |
| `member_count` | integer, not null | Must be at least 1. |
| `occupation` | text | Optional. |
| `notes` | text | Free-text notes. |
| `status` | text, default `active` | `active` / `inactive`. |
| `inactive_reason` | text | Required when deactivating. |

**`family_member`** — optional per-member breakdown for richer statistics.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `family_id` | text, not null, FK → `family.id` | On delete cascade. |
| `national_id` | text | Optional. |
| `name` | text, not null | Member name. |
| `relationship` | text, not null | wife / son / daughter / other. |
| `education_level` | text, not null | none … post_graduate. |
| `gender` | text, default `male` | male / female. |
| `birth_date` | timestamp | Optional. |

**`aid_type`** — categories of aid and their default units.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `name` | text, not null | Unique for active types. |
| `category` | text, not null | Grouping category. |
| `default_unit` | text, not null | e.g. box, litre, kg. |
| `status` | text, default `active` | `active` / `inactive`. |

**`aid_provider`** — organizations and independent initiators, linked to user accounts.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Primary key. |
| `type` | `provider_type` enum | `organization` / `independent_initiator`. |
| `name` | text, not null | Provider name. |
| `contact_person` / `phone` / `email` | text | Contact details. |
| `notes` | text | Free-text notes. |
| `linked_user_id` | text, FK → `user.id` | On delete set null; links to the provider's login account. |
| `status` | text, default `active` | `active` / `inactive`. |

**Operational and accountability tables.** On top of the master data, the operational workflow adds **`aid_contribution`** (header: provider, overall `contribution_status`, notes) and **`aid_contribution_line`** (per-camp line: `contribution_id`, `camp_id`, `aid_type_id`, planned and actual quantities, unit, planned delivery / receipt dates, `contribution_line_status`, and line notes). Accountability adds **`complaint`** (type, camp, message, tracking number, `complaint_status`, resolution/rejection notes), **`audit_log`** (actor, action, entity, old/new value snapshots, IP address, user agent), and **`notification`** (recipient user, message, link, `notification_status`).

### Key Relationships
- **Camp → Family:** one-to-many (a camp contains many families; a family belongs to one camp).
- **Family → FamilyMember:** one-to-many (optional per-member breakdown).
- **Camp ↔ User (Camp Manager):** many-to-many through **CampAssignment**.
- **AidContribution → AidContributionLine:** one-to-many (a contribution has many camp lines).
- **AidContributionLine → Camp / AidType:** each line references exactly one camp and one aid type.
- **AidProvider → User:** each provider is linked to one active user account.

### Domain Enums (PostgreSQL `pgEnum`)
`user_role`, `gaza_governorate`, `camp_status`, `need_level`, `provider_type`, `contribution_status`, `contribution_line_status`, `complaint_type`, `complaint_status`, `notification_status`.

---

## 9. Authorization and Security Summary

Security is enforced consistently across the whole system:

- **Server-side authorization on every protected query and mutation** — the UI never relies on hidden buttons alone.
- **System Administrator** can access all system data.
- **Camp Manager** can access only assigned camps (families, incoming aid, complaints, reports).
- **Providers** can access only their own provider profile and contributions.
- **Beneficiaries** can submit and track complaints through public forms only.
- Banned users cannot log in; the last active administrator cannot be deactivated.
- Passwords are hashed and never written to audit logs.
- Zod validation guards every form and API request separately from the Drizzle schema.

---

## 10. Conclusion

The Unified IDP Camp Management System delivers a complete, secure, and role-based platform for managing IDP camps and camp-level humanitarian aid. All seven development phases were completed: project setup, authentication and user management, master data, the aid-contribution and receipt-confirmation workflow, public complaints and tracking, role-based dashboards and reports, and the audit/notification/hardening layer.

The project was built end to end by two full-stack developers, **Ahmad Abu Abada** and **Ahmad Al Qoumboz**, using **Next.js**, **TypeScript**, **Neon PostgreSQL 18**, **Drizzle ORM**, **Better Auth**, **Zod**, and the **NextAdmin** dashboard template. Throughout the system, the core rule that **aid is managed at the camp level only** was strictly respected, keeping the platform realistic, accountable, and aligned with how humanitarian aid is delivered on the ground.
