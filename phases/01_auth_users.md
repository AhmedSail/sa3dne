# Phase 01 - Authentication, Authorization, and User Management

## Objective
Implement secure login, logout, role-based routing, server-side authorization, password changing, and admin user management.

## Scope
- User model.
- Role model or enum.
- User status active/inactive.
- Secure password hashing.
- Login page.
- Logout action.
- Protected dashboard layout.
- Server-side permission utilities.
- Admin user list.
- Create user.
- Edit user.
- Deactivate user.
- Prevent deactivation of last active System Administrator.
- Change password.
- Basic audit-ready service hooks.

## Roles
- SYSTEM_ADMIN
- CAMP_MANAGER
- ORG_REPRESENTATIVE
- INDEPENDENT_INITIATOR

Beneficiary is public and does not need a full system account in MVP.

## Core Models
- User
  - id
  - fullName
  - username
  - email
  - phone
  - passwordHash
  - role
  - status
  - createdAt
  - updatedAt

## Authorization Rules
- Backend authorization is mandatory.
- Unauthenticated users are redirected or rejected.
- Authenticated users without permission receive Forbidden.
- Inactive users cannot log in.
- Role changes affect permissions immediately after next request/session refresh.

## Drizzle Notes
- Define tables using `pgTable` and PostgreSQL column types.
- Export select/insert types with `$inferSelect` and `$inferInsert`.
- Use Zod schemas for request validation separately from Drizzle schemas.
- Add indexes and foreign keys for important relationships.
- Generate and apply migrations with drizzle-kit.

## UI Pages
- `/login`
- `/dashboard`
- `/dashboard/users`
- `/dashboard/users/new`
- `/dashboard/users/[id]/edit`
- `/dashboard/settings/change-password`

## Acceptance Criteria
- Active admin can log in and reach Admin Dashboard.
- Active Camp Manager can log in and reach Camp Manager Dashboard.
- Invalid credentials show generic error.
- Inactive account is blocked.
- Logout invalidates session/token.
- Old logged-out token cannot access protected APIs.
- Admin can create users.
- Duplicate email/username is rejected.
- Admin can edit user details.
- Admin can deactivate users.
- Last active admin cannot be deactivated.
- User can change password with current password validation.
