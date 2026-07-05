# Phase 05 - Dashboards, Reports, and Camp Need Classification

## Objective
Implement role-based dashboards, basic reports, and manual camp need classification.

## Scope
- Admin dashboard.
- Camp Manager dashboard.
- Provider dashboard.
- Contribution reports.
- Complaint reports.
- Filters by date, camp, aid type, provider, and status.
- Manual camp need level update.
- Provider camp needs view.
- Simple charts/tables.

## Business Rules
- Admin dashboard is system-wide.
- Camp Manager dashboard includes assigned camps only.
- Provider dashboard includes own contributions only.
- Reports must enforce backend access scope.
- MVP supports manual camp need classification only.
- Providers can view camp-level need data only, not detailed family records.

## Dashboard Metrics
### Admin
- Camp count
- Family count
- Individual count
- Provider count
- Contribution count
- Complaint count
- Contribution status breakdown
- Complaint status breakdown

### Camp Manager
- Assigned camp statistics
- Families and individuals
- Incoming aid
- Pending confirmations
- Received aid
- Open complaints

### Provider
- Own contributions
- Totals by camp
- Totals by aid type
- Confirmation status breakdown

## Drizzle Notes
- Define tables using `pgTable` and PostgreSQL column types.
- Export select/insert types with `$inferSelect` and `$inferInsert`.
- Use Zod schemas for request validation separately from Drizzle schemas.
- Add indexes and foreign keys for important relationships.
- Generate and apply migrations with drizzle-kit.

## UI Pages
- `/dashboard/admin`
- `/dashboard/camp-manager`
- `/dashboard/provider`
- `/dashboard/reports`
- `/dashboard/camp-needs`

## Acceptance Criteria
- Admin sees system-wide counts.
- Non-admin cannot access admin dashboard.
- Camp Manager sees assigned camp data only.
- Camp Manager with no camp sees clear empty state.
- Provider sees own contribution statistics only.
- Admin can filter contribution report by status.
- Camp Manager report is scoped to assigned camp.
- Empty report result shows no data state.
- Authorized user can update camp need level to critical.
- Invalid need level is rejected.
- Provider can view authorized camp needs.
- Provider cannot see detailed family records.
- Provider can filter camps by critical need.

## NextAdmin UI Requirements
- Use the existing NextAdmin dashboard cards for metrics.
- Use existing table components for reports.
- Use existing chart components for contribution and complaint breakdowns.
- Keep visual style consistent with the template.
