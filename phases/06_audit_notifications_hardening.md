# Phase 06 - Audit Logs, Notifications, and Hardening

## Objective
Add accountability, notifications, final security hardening, QA fixes, and production readiness improvements.

## Scope
- AuditLog model.
- Central audit logging service.
- Log important actions.
- Audit log list and filters for Admin.
- Notification model.
- Create notification when contribution is submitted.
- Create notification when receipt status changes.
- Notification list for authenticated users.
- Mark notification as read.
- Security review.
- Permission review.
- Validation review.
- UX polish.
- Error handling.
- Production build fixes.

## Core Models
- AuditLog
  - id
  - userId
  - action
  - entityType
  - entityId
  - oldValueJson
  - newValueJson
  - ipAddress
  - userAgent
  - createdAt

- Notification
  - id
  - userId
  - title
  - message
  - entityType
  - entityId
  - link
  - status
  - createdAt
  - readAt

## Business Rules
- Important system actions must be recorded.
- Password values must never be stored in audit logs.
- Only System Administrator can view audit logs.
- Audit failures must not expose sensitive data.
- Camp Manager receives notification when provider submits aid for assigned camp.
- If camp has no manager, optionally notify System Administrator.
- Provider receives notification when line is received, partially received, not received, or rejected.
- Notifications must respect scope.
- Notification links open relevant record.
- Users can mark notifications as read.

## Actions to Audit
- User create/edit/deactivate
- Password change without password values
- Camp create/edit/deactivate
- Family create/edit/deactivate
- Aid type create/edit/deactivate
- Provider create/edit/deactivate
- Contribution create/submit/cancel
- Receipt confirmation status changes
- Complaint status changes
- Need level changes

## Drizzle Notes
- Define tables using `pgTable` and PostgreSQL column types.
- Export select/insert types with `$inferSelect` and `$inferInsert`.
- Use Zod schemas for request validation separately from Drizzle schemas.
- Add indexes and foreign keys for important relationships.
- Generate and apply migrations with drizzle-kit.

## UI Pages
- `/dashboard/audit-logs`
- `/dashboard/notifications`

## Acceptance Criteria
- Aid contribution submission creates audit log.
- Password change audit log does not include old/new password.
- Admin filters audit logs by action.
- Non-admin cannot view audit logs.
- Camp Manager receives unread notification for new submitted aid.
- Multiple camp lines notify relevant managers.
- Provider receives notification when receipt is confirmed.
- Notification link opens relevant contribution line.
- Authenticated user sees unread notifications.
- User can mark notification as read.
- Final build passes.
- Major protected APIs have server-side permission tests or documented manual test cases.
