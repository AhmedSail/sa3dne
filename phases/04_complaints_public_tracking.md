# Phase 04 - Complaints, Suggestions, and Public Tracking

## Objective
Allow beneficiaries to submit complaints, suggestions, or unmet needs without accounts, and allow authorized users to review and update them.

## Scope
- Public feedback form.
- Public tracking page by tracking number.
- Unique tracking number generation.
- Complaint list for Admin and Camp Manager.
- Complaint detail page.
- Update complaint status.
- Resolution notes and rejection reason validation.
- Role-based complaint access.

## Core Model
- Complaint
  - id
  - trackingNumber
  - campId
  - type
  - beneficiaryName
  - phone
  - details
  - status
  - resolutionNotes
  - rejectionReason
  - reviewedById
  - reviewedAt
  - createdAt
  - updatedAt

## Business Rules
- Public complaint submission does not require login.
- Every complaint must have a unique tracking number.
- Tracking page must show only safe information.
- Camp Manager can review complaints only for assigned camps.
- System Administrator can review all complaints.
- Rejected complaints require rejection reason.
- Resolved complaints require resolution notes.
- Filters must not expose unauthorized camp data.

## Drizzle Notes
- Define tables using `pgTable` and PostgreSQL column types.
- Export select/insert types with `$inferSelect` and `$inferInsert`.
- Use Zod schemas for request validation separately from Drizzle schemas.
- Add indexes and foreign keys for important relationships.
- Generate and apply migrations with drizzle-kit.

## UI Pages
- `/feedback`
- `/track`
- `/dashboard/complaints`
- `/dashboard/complaints/[id]`

## Acceptance Criteria
- Beneficiary submits valid unmet need and receives tracking number.
- Type is required.
- Details are required.
- Tracking existing complaint displays status.
- Invalid tracking number displays no-result message.
- Camp Manager resolves complaint in assigned camp.
- Resolution notes are saved.
- Camp Manager cannot review complaint in another camp.
- Reject complaint without reason is rejected.
- Complaint list supports filters by camp, type, status, date, keyword.
- Empty filter result shows empty state.
