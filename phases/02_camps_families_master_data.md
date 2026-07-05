# Phase 02 - Camps, Families, Aid Types, and Providers

## Objective
Implement the core master data needed before aid workflows: camps, camp assignments, families for statistics, aid types, and aid providers.

## Scope
- Camp CRUD.
- Assign Camp Managers to camps.
- Deactivate/close camps.
- Family registration inside camp for statistics only.
- Edit family.
- Deactivate family with reason.
- Aid Type CRUD.
- Deactivate aid type while keeping historical visibility.
- Aid Provider CRUD.
- Link provider to user account.
- Provider contribution history placeholder page.

## Core Models
- Camp
  - id, name, locationText, capacity, operationalStatus, needLevel, notes, status
- CampAssignment
  - id, campId, userId
- Family
  - id, campId, headName, nationalId, phone, memberCount, notes, status, inactiveReason
- AidType
  - id, name, category, defaultUnit, status
- AidProvider
  - id, type, name, contactPerson, phone, email, notes, linkedUserId, status

## Business Rules
- Camp capacity must be greater than zero.
- Inactive/closed camps cannot receive new contributions later.
- Camp Manager can manage only assigned camps.
- Family national ID must be unique for active records.
- Families are statistics only; no aid entitlement.
- Member count must be at least 1.
- Deactivate family instead of physical delete.
- Active aid type names must be unique.
- Deactivated aid types remain visible in historical records but not selectable later.
- Providers must be linked to active user accounts.
- Organization Representative links to Organization provider.
- Independent Aid Initiator links to Independent Initiator provider.

## Drizzle Notes
- Define tables using `pgTable` and PostgreSQL column types.
- Export select/insert types with `$inferSelect` and `$inferInsert`.
- Use Zod schemas for request validation separately from Drizzle schemas.
- Add indexes and foreign keys for important relationships.
- Generate and apply migrations with drizzle-kit.

## UI Pages
- `/dashboard/camps`
- `/dashboard/camps/new`
- `/dashboard/camps/[id]`
- `/dashboard/camps/[id]/edit`
- `/dashboard/families`
- `/dashboard/families/new`
- `/dashboard/aid-types`
- `/dashboard/providers`

## Acceptance Criteria
- Admin can create camp with valid data.
- Capacity 0 is rejected.
- Admin can assign active Camp Manager to camp.
- Inactive manager assignment is rejected.
- Closed camp is no longer selectable for future aid.
- Camp Manager can register family only in assigned camp.
- Duplicate active national ID is rejected.
- Family count and individual count are recalculated after create/edit/deactivate.
- Aid type can be created and deactivated.
- Duplicate active aid type is rejected.
- Provider can be created and linked to an active user.
- Inactive linked user is rejected.
