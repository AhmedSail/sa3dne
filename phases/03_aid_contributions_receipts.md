# Phase 03 - Aid Contributions and Receipt Confirmation

## Objective
Implement the main operational workflow: providers submit aid contributions at camp level and Camp Managers confirm receipt line by line.

## Scope
- Provider contribution draft creation.
- Add contribution lines for one or more camps.
- Submit contribution.
- Notify-ready event when submitted.
- Provider tracks own contribution status.
- Camp Manager views incoming aid for assigned camps.
- Camp Manager confirms full receipt.
- Camp Manager confirms partial receipt.
- Camp Manager marks not received.
- Camp Manager rejects line with reason.
- Reports-ready status updates.

## Core Models
- AidContribution
  - id, providerId, status, notes, submittedAt, createdById, createdAt, updatedAt
- AidContributionLine
  - id, contributionId, campId, aidTypeId, plannedQuantity, unit, plannedDeliveryDate, status, actualReceivedQuantity, actualReceiptDate, confirmationNotes, rejectionReason, confirmedById, confirmedAt

## Business Rules
- Aid contribution is recorded at camp level only.
- Draft contributions are visible to creator/provider and admins only.
- Draft is not visible to Camp Managers until submitted.
- Submitted contribution must contain at least one valid line.
- Submitted contribution cannot be edited except future admin correction flow.
- Each contribution line belongs to one camp.
- A contribution may contain multiple lines for multiple camps.
- Quantity must be greater than zero.
- Inactive camp cannot be selected.
- Inactive aid type cannot be selected.
- Camp Manager sees only assigned camp lines.
- Camp Managers confirm line-level receipt, not header-level receipt.
- Full receipt quantity equals planned quantity unless override is explicitly enabled.
- Partial receipt quantity > 0 and < planned quantity.
- Partial receipt requires notes.
- Not received requires notes and actual quantity must be 0 or empty.
- Rejected requires reason.

## Drizzle Notes
- Define tables using `pgTable` and PostgreSQL column types.
- Export select/insert types with `$inferSelect` and `$inferInsert`.
- Use Zod schemas for request validation separately from Drizzle schemas.
- Add indexes and foreign keys for important relationships.
- Generate and apply migrations with drizzle-kit.

## UI Pages
- `/dashboard/contributions`
- `/dashboard/contributions/new`
- `/dashboard/contributions/[id]`
- `/dashboard/my-contributions`
- `/dashboard/incoming-aid`
- `/dashboard/incoming-aid/[lineId]`

## Acceptance Criteria
- Provider creates draft contribution.
- User without active provider profile cannot create contribution.
- Provider adds valid line with camp, aid type, quantity, unit, delivery date.
- Quantity 0 is rejected.
- Inactive camp is not selectable.
- Contribution without valid lines cannot be submitted.
- Submit changes contribution status to submitted and lines to pending.
- Submitted lines become visible to relevant Camp Managers.
- Provider can see own contribution status only.
- Cross-provider access is Forbidden.
- Camp Manager can see incoming aid only for assigned camp.
- Full receipt sets status received and actual quantity equals planned quantity.
- Missing receipt date is rejected.
- Partial receipt with valid quantity works.
- Partial quantity equal to planned quantity is rejected.
- Partial quantity 0 is rejected.
- Not received requires notes.
- Reject requires reason.
