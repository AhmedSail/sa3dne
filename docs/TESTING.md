# Testing & Quality Assurance

**System:** Unified IDP Camp Management System
**Area:** Test strategy, automated test suite, manual test plan, requirements traceability
**Owner:** Bahaa Abushrar — Test & Project Manager
**Status:** 113 automated tests, all passing

---

## 1. Purpose

This document describes how the system is verified. It covers:

- the test strategy and why each layer exists (§2)
- how to run the suite (§3)
- how the suite is built, and the two mocks it depends on (§4)
- the full inventory of automated tests and what each one protects (§5, §6)
- traceability from phase acceptance criteria to test IDs (§7)
- the manual test plan (§8)
- defects found by testing, with evidence (§9)
- coverage figures and known gaps (§10, §11)

It is written to be read by a developer joining the project, and by a reviewer
checking that the delivered system matches its requirements.

---

## 2. Test strategy

The system is a Next.js App Router application whose entire security model lives
on the server. `CLAUDE.md` states the constraint plainly:

> Enforce permissions on the server for every protected query and mutation.
> Never rely only on hidden frontend buttons.

That single sentence sets the shape of the test suite. Hiding a button is not a
control; the only thing that counts is what the route handler does when a
request arrives from someone who should not have sent it. So the suite spends
most of its effort on **route handlers invoked directly with a forged session**,
rather than on UI rendering.

Testing runs on three layers:

| Layer | What it answers | Count | Where |
|---|---|---|---|
| **Unit** | Is a business rule correct in isolation? | 58 | `tests/unit/` |
| **Integration** | Is the rule actually enforced by the endpoint, for the right roles, at the right time? | 55 | `tests/integration/` |
| **Manual** | Does the workflow hold together for a real user in a browser? | see §8 | §8 |

The split between unit and integration is deliberate, and the receipt-confirmation
feature shows why. Two different questions get asked about it:

- *What does a confirmation mean?* — if a Camp Manager confirms a partial
  receipt of 70 out of 100 units, which columns change and to what. This is pure
  logic with no database and no session. It belongs in a unit test.
- *Who may confirm, and when?* — a provider must not confirm their own aid; a
  Camp Manager must not confirm another camp's line; nothing can be confirmed
  before the contribution is submitted. This needs a request, a session and a
  role. It belongs in an integration test.

Keeping these separate means a broken rule fails one focused test with an
obvious name, instead of fifteen scattered ones.

---

## 3. Running the tests

```bash
pnpm test            # run the whole suite once
pnpm test:watch      # re-run affected tests on save
pnpm test:coverage   # run with a coverage report
```

Expected output:

```
 ✓ tests/unit/permissions.test.ts          (20 tests)
 ✓ tests/unit/receipt-rules.test.ts        (17 tests)
 ✓ tests/unit/constants.test.ts            (12 tests)
 ✓ tests/unit/format-number.test.ts         (9 tests)
 ✓ tests/integration/incoming-aid.test.ts  (18 tests)
 ✓ tests/integration/contributions.test.ts (20 tests)
 ✓ tests/integration/admin-boundaries.test.ts (17 tests)

 Test Files  7 passed (7)
      Tests  113 passed (113)
   Duration  ~1.6s
```

No database and no network are required, and no environment file needs to be
configured. The whole suite finishes in under two seconds, which is the point:
a suite that is slow or needs setup stops being run.

### Tooling

| Tool | Version | Why |
|---|---|---|
| Vitest | `^3.2.7` | Native TypeScript and ESM, so route handlers import without a build step. |
| `vite-tsconfig-paths` | `^5.1.4` | Resolves the `@/*` alias from `tsconfig.json`, so tests import modules exactly as the app does. |
| `@vitest/coverage-v8` | `^3` | Coverage reporting. |

Configuration lives in [`vitest.config.ts`](../vitest.config.ts): Node
environment (there are no component tests), `tests/**/*.test.ts` as the test
glob, and `restoreMocks: true` so no test can leak a mock into the next one.

---

## 4. How the suite is built

### 4.1 Two mocks, and why

Route handlers cannot be imported in a test without help. Two modules throw at
import time when their environment variables are missing:

- `src/db/index.ts` requires `DATABASE_URL`
- `src/lib/auth/auth.ts` requires `BETTER_AUTH_SECRET`

[`tests/setup.ts`](../tests/setup.ts) sets placeholder values so any transitive
import resolves. The values are never used, because both modules are replaced:

```ts
vi.mock("@/db", async () => {
  const { dbMock } = await import("../helpers/db-mock");
  return { db: dbMock.db };
});

vi.mock("@/lib/auth", async () => {
  const { authMock } = await import("../helpers/auth-mock");
  return { auth: authMock.auth };
});
```

### 4.2 The auth mock

[`tests/helpers/auth-mock.ts`](../tests/helpers/auth-mock.ts)

Every protected route resolves the caller the same way:

```ts
const session = (await auth.api.getSession({ headers: request.headers })) as any;
```

One consistent line across the whole codebase means one function controls
identity in every test:

```ts
authMock.signInAs("camp_manager", "cm-1");  // act as a Camp Manager
authMock.signInAs("admin");                 // act as the System Administrator
authMock.signOut();                         // act as an anonymous visitor
```

This is what makes role-boundary testing cheap. Asserting that *no* non-admin
role can assign roles is a five-line loop (IT-USR-02) rather than five sign-in
flows.

### 4.3 The database mock

[`tests/helpers/db-mock.ts`](../tests/helpers/db-mock.ts)

Drizzle builds queries by chaining and only executes on `await`:

```ts
const rows = await db.select().from(camp).where(eq(camp.id, id)).limit(1);
```

The mock reproduces that shape with a `Proxy`: every method returns the same
chain object, and awaiting the chain resolves to the next value the test queued.
It also records every call, so a test can assert what the route *tried to write*
without a database:

```ts
dbMock.queue(
  [submittedLine(CAMP_A)],          // 1st query: the line + its parent status
  [{ campId: CAMP_A }],             // 2nd query: the manager's camp assignments
);

const response = await patch(fullReceipt);

expect(response.status).toBe(200);
expect(dbMock.firstArgOf("update", "set")).toMatchObject({
  status: "received",
  actualReceivedQuantity: 100,
});
```

**The one rule to remember:** results are matched to queries **by execution
order**, not by table. A test queues one result per awaited query, in the order
the route runs them. If a route gains a query in the middle, the tests for it
must be re-queued — which is a fair trade for a suite that needs no database.

Two guardrails on the negative tests keep this honest. Every "should be refused"
test asserts both the status code *and* that no write was attempted:

```ts
expect(response.status).toBe(403);
expect(dbMock.chainsStartingWith("update")).toHaveLength(0);
```

Without the second line, a test would pass just as happily against a route that
rejects the request *after* corrupting the data.

### 4.4 One refactor made for testability

The receipt-confirmation rules were originally a `switch` inside the PATCH
handler in `src/app/api/incoming-aid/[lineId]/route.ts`. They were extracted, with
behaviour unchanged, into
[`src/lib/contributions/receipt.ts`](../src/lib/contributions/receipt.ts),
which exports:

- `confirmSchema` — the Zod discriminated union over the four actions
- `buildReceiptUpdate(line, data, ctx)` — a pure function returning either the
  exact column values to persist, or a rule violation

The route now handles authentication, camp scoping and persistence; the module
owns the meaning of a confirmation. The richest rule set in the system became
unit-testable at 17 tests, and the route kept its integration tests unchanged.
This is the only production behaviour change made for testing, and `pnpm build`
and `tsc --noEmit` both pass against it.

---

## 5. Unit tests (58)

### 5.1 `tests/unit/permissions.test.ts` — role matrix (20)

Asserts the declarative access-control matrix in
`src/lib/auth/modules/authorization/permissions.ts` against
`.claude/Roles_and_Permissions_Matrix_EN.md`.

| ID | Verifies |
|---|---|
| UT-PRM-01 | All 15 authorizable resources are declared |
| UT-PRM-02 | Exactly the six application roles exist |
| UT-PRM-03 | No role grants an action outside its resource's declared actions |
| UT-PRM-04 | Admin can manage users, roles, camps and audit data |
| UT-PRM-05 | Admin reads and receives contributions but does not author them |
| UT-PRM-06 | Camp Manager can receive contributions but never create them |
| UT-PRM-07 | Camp Manager can manage families, including transfers |
| UT-PRM-08 | Camp Manager cannot create/delete camps or assign managers |
| UT-PRM-09 | Camp Manager cannot administer users, roles or audit logs |
| UT-PRM-10 | Organization representative creates *official* contributions only |
| UT-PRM-11 | Independent initiator creates *independent* contributions only |
| UT-PRM-12 | No provider role may confirm receipt of its own aid |
| UT-PRM-13 | No provider role may touch camps or families |
| UT-PRM-14 | Independent initiator cannot read family data; org representative can |
| UT-PRM-15 | Beneficiary may file and track complaints |
| UT-PRM-16 | Beneficiary cannot reach any operational resource |
| UT-PRM-17 | The fallback `user` role has no more power than a beneficiary |
| UT-PRM-18 | Only the administrator can assign roles |
| UT-PRM-19 | Only the administrator can read audit and login-attempt logs |
| UT-PRM-20 | Every role can edit its own profile |

Three of these deserve explanation.

**UT-PRM-03** is a typo detector. `camp: ["delete_all"]` is not a compile error —
it is a permission that silently never matches, failing shut in a way nobody
notices until an administrator reports that a button does nothing. The test
walks every role's statements and asserts each action was declared on that
resource in `createAccessControl`.

**UT-PRM-12** encodes separation of duties: the provider promises the aid, the
camp side confirms what arrived. A provider who could confirm their own delivery
could report a full delivery that never happened, which defeats the purpose of
the receipt workflow.

**UT-PRM-17** guards a default. New sign-ups are given the `user` role
(`defaultRole: "user"` in the better-auth admin plugin). If `user` ever drifted
into holding operational permissions, self-registration would become a privilege
escalation. The test pins `user`'s statements to be identical to `beneficiary`'s.

### 5.2 `tests/unit/receipt-rules.test.ts` — receipt rules (17)

Covers `confirmSchema` (UT-RCP-01 … 08) and `buildReceiptUpdate` (UT-RCP-09 … 17).

**Validation — mandatory fields per action:**

| ID | Verifies |
|---|---|
| UT-RCP-01 | Full receipt with a receipt date is accepted |
| UT-RCP-02 | Full receipt without a receipt date is rejected |
| UT-RCP-03 | Partial receipt without notes is rejected |
| UT-RCP-04 | Partial receipt with a zero or negative quantity is rejected |
| UT-RCP-05 | Partial receipt with a fractional quantity is rejected |
| UT-RCP-06 | "Not received" without notes is rejected |
| UT-RCP-07 | Rejection without a reason is rejected |
| UT-RCP-08 | An unknown action is rejected |

**Rules — what each action persists:**

| ID | Verifies |
|---|---|
| UT-RCP-09 | Full receipt derives the quantity from the *planned* quantity |
| UT-RCP-10 | Full receipt ignores any quantity supplied by the client |
| UT-RCP-11 | Partial receipt below planned is accepted and stores notes |
| UT-RCP-12 | Partial receipt **equal to** planned is refused (boundary) |
| UT-RCP-13 | Partial receipt **above** planned is refused |
| UT-RCP-14 | "Not received" forces quantity to 0 and clears the receipt date |
| UT-RCP-15 | Rejection clears the quantity and stores the reason |
| UT-RCP-16 | Every successful action stamps who confirmed it and when |
| UT-RCP-17 | A partial receipt on a single-unit line is impossible (boundary) |

UT-RCP-10 is the anti-tampering test. A `full` action carries no quantity in its
schema variant; the server reads `line.plannedQuantity` from the database
instead. The test posts `actualReceivedQuantity: 999999` alongside a full
receipt and asserts the stored value is 100 — the client cannot inflate what was
received by claiming a larger number.

UT-RCP-12 and UT-RCP-17 pin the boundary from both sides. `partial` must mean
*strictly less than* planned; a "partial" receipt of the full amount is a full
receipt and must be recorded as one, or the two statuses stop meaning anything
in reports. UT-RCP-17 draws out the consequence: on a line of 1 unit there is no
valid partial quantity at all, because the schema forbids 0 and the rule forbids
1. That is correct, and it is written down so nobody "fixes" it later.

### 5.3 `tests/unit/constants.test.ts` — enum parity (12)

`src/lib/constants.ts` mirrors the PostgreSQL enums so they can be reused for
Zod validation and UI selects without importing the Drizzle schema everywhere.
A mirror that drifts from its source is worse than no mirror: a role literal
that no longer matches the database silently never matches anything.

UT-CST-01 … 09 pin each constant array to its `pgEnum` — `USER_ROLES` to
`userRole.enumValues`, `CAMP_STATUSES` to `campStatus.enumValues`, and so on for
need levels, provider types, contribution statuses, contribution line statuses,
complaint types, complaint statuses and notification statuses.

| ID | Verifies |
|---|---|
| UT-CST-10 | The permission matrix defines a role for every database role |
| UT-CST-11 | The administrator literal is `admin`, as the routes check |
| UT-CST-12 | Aid is managed at camp level only (`AID_MANAGEMENT_LEVEL === "camp"`) |

UT-CST-10 is a cross-layer check spanning three definitions of "role": the
database enum, the permission matrix, and the constants list. If the database
can store a role the matrix has never heard of, a user holding it authorizes
against nothing.

**UT-CST-01 and UT-CST-11 found a real defect. See §9.1.**

### 5.4 `tests/unit/format-number.test.ts` — presentation helpers (9)

Pure and cheap, but these render the population and aid figures that
decision-makers read.

| ID | Verifies |
|---|---|
| UT-FMT-01 | Values under 1,000 are unchanged |
| UT-FMT-02 | Thousands and millions abbreviate (`1500 → "1.5K"`) |
| UT-FMT-03 | Rounds rather than truncates (`1249 → "1.2K"`, `1250 → "1.3K"`) |
| UT-FMT-04 | Negative values are handled |
| UT-FMT-05 | `standardFormat` always shows two decimal places |
| UT-FMT-06 | Thousands are grouped with separators |
| UT-FMT-07 | `createTimeFrameExtractor` returns the matching section |
| UT-FMT-08 | Returns undefined when the section is absent |
| UT-FMT-09 | Returns undefined when no timeframe is selected |

Both formatters pin a locale (`"en"` / `"en-US"`) rather than relying on the
host default, so these tests also protect the output from changing when the
suite runs on a machine with different regional settings.

---

## 6. Integration tests (55)

### 6.1 `tests/integration/incoming-aid.test.ts` — receipt endpoint (18)

`PATCH /api/incoming-aid/[lineId]` — the phase 03 acceptance path: a Camp
Manager confirming what actually arrived at their camp.

**Authentication and role scoping:**

| ID | Scenario | Expected |
|---|---|---|
| IT-RCP-01 | Anonymous request | 401, and no query is run at all |
| IT-RCP-02 | Provider tries to confirm receipt | 403, no write |
| IT-RCP-03 | Beneficiary tries to confirm receipt | 403, no write |
| IT-RCP-04 | Camp Manager confirms a line for a camp they are **not** assigned to | 403, no write |
| IT-RCP-05 | Camp Manager with no assignment at all | 403 |
| IT-RCP-06 | Camp Manager confirms a line for their **own** camp | 200 |
| IT-RCP-07 | Administrator confirms any line, with no assignment | 200 |
| IT-RCP-08 | Line does not exist | 404 |

**Contribution status gate:**

| ID | Scenario | Expected |
|---|---|---|
| IT-RCP-09 | Line on a **draft** contribution | 409, no write |
| IT-RCP-10 | Line on a **cancelled** contribution | 409 |

**Actions persisted:**

| ID | Scenario | Expected |
|---|---|---|
| IT-RCP-11 | Full receipt | 200; stores planned quantity + confirming user |
| IT-RCP-12 | Partial receipt of 70/100 | 200; stores 70 and the notes |
| IT-RCP-13 | Partial receipt of 100/100 | 400, no write |
| IT-RCP-14 | Rejection with no reason | 400, no write |
| IT-RCP-15 | Rejection with a reason | 200; clears quantity, stores reason |
| IT-RCP-16 | "Not received" with no notes | 400, no write |
| IT-RCP-17 | Full receipt claiming 999,999 units | 200; stores 100 |
| IT-RCP-18 | Unknown action | 400, no write |

IT-RCP-04 is the most important test in the suite. It is the tenancy boundary:
the line belongs to camp B, the manager is assigned to camp A only, and the
request must be refused. Everything the Camp Manager role is trusted with rests
on this check. §9.2 shows it catching a deliberately introduced bypass.

IT-RCP-09 is a workflow rule, not a permission rule. A draft contribution has
not been promised to anyone, so there is nothing to receive; the endpoint must
distinguish "you may not" (403) from "not yet" (409).

### 6.2 `tests/integration/contributions.test.ts` — provider workflow (20)

`POST /api/contributions/[id]/submit` and `POST /api/contributions/[id]/lines`.

**Submitting (IT-CTB, 9):**

| ID | Scenario | Expected |
|---|---|---|
| IT-CTB-01 | Anonymous request | 401, no query |
| IT-CTB-02 | Contribution does not exist | 404 |
| IT-CTB-03 | Provider submits **another provider's** contribution | 403, no write |
| IT-CTB-04 | User with no active provider profile | 403 |
| IT-CTB-05 | Contribution with **zero lines** | 400, no write |
| IT-CTB-06 | Already-submitted contribution | 409, no write |
| IT-CTB-07 | Cancelled contribution | 409 |
| IT-CTB-08 | Valid draft with lines | 200; header → submitted, lines → pending |
| IT-CTB-09 | Submission stamps `submittedAt` | `Date` recorded |

IT-CTB-04 covers a deactivated provider as well as an unlinked user, because the
profile lookup filters on `status = "active"`: deactivating a provider revokes
their ability to submit, without deleting their history.

IT-CTB-06 prevents the same aid being promised to a camp twice.

**Adding lines (IT-LIN, 11):**

| ID | Scenario | Expected |
|---|---|---|
| IT-LIN-01 | Anonymous request | 401 |
| IT-LIN-02 | Adding a line to a **submitted** contribution | 409, no insert |
| IT-LIN-03 | Provider adds a line to another provider's contribution | 403 |
| IT-LIN-04 | Quantity of 0 or −10 | 400, no insert |
| IT-LIN-05 | Fractional quantity (2.5) | 400 |
| IT-LIN-06 | Line targeting a **closed** camp | 400, no insert |
| IT-LIN-07 | Line targeting a **deactivated** camp | 400 |
| IT-LIN-08 | Line referencing a missing camp | 404 |
| IT-LIN-09 | Line using a **deactivated** aid type | 400 |
| IT-LIN-10 | Valid line | 201; inserted against the active camp and aid type |
| IT-LIN-11 | New line carries no receipt data | quantity/date/confirmer all null |

IT-LIN-02 protects the integrity of a submitted promise: once a contribution is
visible to camps, its contents must not change underneath them.

IT-LIN-06 and IT-LIN-07 test the two independent camp status fields separately.
`camp.status` (`active`/`inactive`, the record's lifecycle) and
`camp.operationalStatus` (`active`/`inactive`/`closed`, the camp's real-world
state) are distinct columns, and the route refuses a line if *either* disqualifies
the camp. Testing them separately means a regression in one is not masked by the
other.

IT-LIN-11 encodes the phase 03 separation: a provider only ever *plans* aid. What
actually arrived is decided later, by the camp side, through the receipt endpoint.

### 6.3 `tests/integration/admin-boundaries.test.ts` — admin-only surfaces (17)

`PUT /api/users/[id]` and `POST /api/providers`.

**User role management (IT-USR, 6):**

| ID | Scenario | Expected |
|---|---|---|
| IT-USR-01 | Anonymous request | 401, no query |
| IT-USR-02 | **Each** of the five non-admin roles tries to assign a role | 403, no write |
| IT-USR-03 | Administrator changes a role | 200; role written |
| IT-USR-04 | Role outside the enum (`super_admin`) | 400, no write |
| IT-USR-05 | Partial update (name only) | only `name` written; `role` absent |
| IT-USR-06 | Name shorter than the minimum | 400 |

IT-USR-02 enumerates the non-admin roles explicitly rather than spot-checking
one. A new role added to the enum without a matching authorization decision is
exactly the kind of gap this test exists to catch. It is the privilege
escalation guard: the entire permission model rests on role assignment being
administrator-only.

IT-USR-05 asserts an update mentions only what it changes, so a partial edit
cannot blank the fields it did not send.

**Provider registration (IT-PRV, 11):**

| ID | Scenario | Expected |
|---|---|---|
| IT-PRV-01 | Anonymous request | 401 |
| IT-PRV-02 | **Each** of the five non-admin roles registers a provider | 403, no insert |
| IT-PRV-03 | Provider type outside the enum | 400 |
| IT-PRV-04 | Malformed email | 400, no insert |
| IT-PRV-05 | Linked to a non-existent account | 400 |
| IT-PRV-06 | Linked to a **banned** account | 400 |
| IT-PRV-07 | Organization provider linked to an independent initiator | 400, no insert |
| IT-PRV-08 | Independent provider linked to an organization representative | 400 |
| IT-PRV-09 | Provider linked to a **Camp Manager** account | 400, no insert |
| IT-PRV-10 | Organization provider linked to an org representative | 201 |
| IT-PRV-11 | Provider registered with **no** linked account | 201; `linkedUserId: null` |

IT-PRV-06 closes a re-entry route: deactivating an account must not leave a way
back in through a provider profile.

IT-PRV-09 is separation of duties again, enforced at registration rather than at
confirmation. If a Camp Manager account could be linked to a provider profile,
one person could both promise aid and confirm its arrival. Blocking the link
prevents the conflict from ever existing.

IT-PRV-11 confirms the workflow tolerates reality: providers are often
registered offline, before their user account exists.

---

## 7. Requirements traceability

Each phase file in `phases/` carries an **Acceptance Criteria** section. This
maps those criteria to the tests that verify them.

### Phase 01 — Authentication & Users

| Requirement | Tests | Status |
|---|---|---|
| Only the System Administrator manages users and assigns roles | UT-PRM-18, IT-USR-02, IT-USR-03 | Automated |
| Role values are constrained to the defined set | UT-CST-01, UT-CST-11, IT-USR-04 | Automated |
| Every defined role exists in the permission matrix | UT-PRM-02, UT-CST-10 | Automated |
| A default sign-up cannot gain operational access | UT-PRM-17 | Automated |
| Protected routes reject anonymous callers | IT-RCP-01, IT-CTB-01, IT-LIN-01, IT-USR-01, IT-PRV-01 | Automated |
| A deactivated account cannot act | IT-PRV-06, IT-CTB-04 | Automated |
| Sign-in / sign-out / password change in a browser | MT-AUTH-01 … 04 | Manual |

### Phase 02 — Camps, Families & Master Data

| Requirement | Tests | Status |
|---|---|---|
| Camp Manager accesses only assigned camps | IT-RCP-04, IT-RCP-05, IT-RCP-06 | Automated |
| Camp Manager cannot create or delete camps | UT-PRM-08 | Automated |
| Inactive or closed camps are not selectable | IT-LIN-06, IT-LIN-07 | Automated |
| Deactivated aid types are not selectable | IT-LIN-09 | Automated |
| Families are for statistics only, never aid distribution | UT-CST-12, UT-PRM-13 | Automated |
| Duplicate national ID is rejected for active families | MT-FAM-03 | Manual — see §11 |
| Family transfer checks both source and target camp | MT-FAM-04 | Manual — see §11 |

### Phase 03 — Aid Contributions & Receipts

| Requirement | Tests | Status |
|---|---|---|
| Aid is managed at **camp level only** | UT-CST-12, IT-LIN-10 | Automated |
| Providers act only on their own contributions | IT-CTB-03, IT-LIN-03 | Automated |
| A contribution is editable only while a draft | IT-LIN-02, IT-CTB-06, IT-CTB-07 | Automated |
| A contribution cannot be submitted with no lines | IT-CTB-05 | Automated |
| Submission makes lines visible to Camp Managers | IT-CTB-08 | Automated |
| Planned quantity must be a positive integer | UT-RCP-04, UT-RCP-05, IT-LIN-04, IT-LIN-05 | Automated |
| Only admin / Camp Manager confirm receipt | IT-RCP-02, IT-RCP-03, UT-PRM-12 | Automated |
| Camp Manager confirms only their own camps' lines | IT-RCP-04 | Automated |
| Draft lines are never confirmable | IT-RCP-09, IT-RCP-10 | Automated |
| Full receipt records the planned quantity | UT-RCP-09, IT-RCP-11 | Automated |
| Partial receipt must be less than planned | UT-RCP-12, UT-RCP-13, UT-RCP-17, IT-RCP-13 | Automated |
| "Not received" requires notes | UT-RCP-06, IT-RCP-16 | Automated |
| Rejection requires a reason | UT-RCP-07, IT-RCP-14, IT-RCP-15 | Automated |
| The client cannot inflate received quantities | UT-RCP-10, IT-RCP-17 | Automated |
| Confirmation records who and when | UT-RCP-16, IT-RCP-11 | Automated |
| Provider type must match the linked account's role | IT-PRV-07, IT-PRV-08, IT-PRV-09 | Automated |
| Draft lines are not visible on the incoming-aid side | — | **Gap — see §11** |

### Phase 05 — Dashboards, Reports & Needs

| Requirement | Tests | Status |
|---|---|---|
| Figures are formatted correctly on dashboard cards | UT-FMT-01 … 06 | Automated |
| Chart timeframe selection resolves per section | UT-FMT-07 … 09 | Automated |
| Camp need classification is manual and constrained to the enum | UT-CST-03 | Automated |
| Non-admin cannot access the admin dashboard | — | **Gap — see §11** |
| Dashboard statistics are scoped by role | — | **Gap — see §11** |

### Phases 04 & 06 — Complaints, Audit & Notifications

Not implemented. `complaintType`, `complaintStatus` and `notificationStatus`
exist in `src/db/schema/enums.ts`, and their parity with the constants list is
tested (UT-CST-07, 08, 09), but there are no tables, routes or UI behind them.
There is nothing further to test until those phases are built. This is a scope
status, not a defect.

---

## 8. Manual test plan

Automated tests do not open a browser. These cases cover what they cannot: that
the NextAdmin shell renders the right thing, that redirects land where they
should, and that the workflow holds together end to end.

**How to run:** seed with `pnpm db:seed`, start with `pnpm dev`, and execute each
case against a fresh browser session. Record the result and date in the last
column. Any failure gets an entry in §9 before it is fixed.

### Authentication (MT-AUTH)

| ID | Steps | Expected | Result |
|---|---|---|---|
| MT-AUTH-01 | Sign in with valid credentials | Lands on the dashboard for the role | |
| MT-AUTH-02 | Sign in with a wrong password | Error shown; no session created | |
| MT-AUTH-03 | Open `/dashboard` while signed out | Redirect to `/auth/sign-in?callbackUrl=…` | |
| MT-AUTH-04 | Sign out, then press the browser Back button | Protected page does not render from cache | |

### Users (MT-USR)

| ID | Steps | Expected | Result |
|---|---|---|---|
| MT-USR-01 | As admin, open the users list | All users listed | |
| MT-USR-02 | As admin, change a user's role and re-check that user | New permissions apply on next sign-in | |
| MT-USR-03 | As Camp Manager, navigate directly to `/dashboard/users` | No access | |

### Camps & Families (MT-FAM)

| ID | Steps | Expected | Result |
|---|---|---|---|
| MT-FAM-01 | As Camp Manager, open the families list | Only families in assigned camps appear | |
| MT-FAM-02 | As Camp Manager with no assignment, open the dashboard | Clear empty state, not an error | |
| MT-FAM-03 | Register a family with an existing active national ID | Rejected with a clear message | |
| MT-FAM-04 | Transfer a family to a camp the manager is not assigned to | Rejected | |
| MT-FAM-05 | Deactivate a family, then re-use its national ID | Accepted (uniqueness applies to active only) | |

### Aid contributions (MT-AID)

| ID | Steps | Expected | Result |
|---|---|---|---|
| MT-AID-01 | As a provider, create a draft, add two lines for different camps, submit | Status → submitted; lines → pending | |
| MT-AID-02 | Try to submit a draft with no lines | Blocked with a clear message | |
| MT-AID-03 | As Camp Manager, open incoming aid | Only submitted lines for assigned camps appear | |
| MT-AID-04 | Confirm a full receipt | Status → received; quantity = planned | |
| MT-AID-05 | Confirm a partial receipt with notes | Status → partially_received | |
| MT-AID-06 | Try a partial receipt equal to the planned quantity | Blocked with a clear message | |
| MT-AID-07 | Reject a line with a reason | Status → rejected; reason stored and shown | |
| MT-AID-08 | As the provider, re-open the contribution after confirmation | Confirmed statuses are visible; contribution not editable | |

### Cross-role checks (MT-SEC)

| ID | Steps | Expected | Result |
|---|---|---|---|
| MT-SEC-01 | As Camp Manager, request another camp's incoming-aid line by URL | Refused, not merely hidden | |
| MT-SEC-02 | As a provider, request another provider's contribution by URL | Refused | |
| MT-SEC-03 | As a provider, `PATCH` an incoming-aid line with `curl` | 403 | |
| MT-SEC-04 | As Camp Manager, `PUT /api/users/{id}` with `curl` to self-promote to admin | 403 | |

MT-SEC-01 … 04 are the manual counterpart to the integration suite, and they
exist because a UI test that only clicks buttons cannot prove a rule is enforced
on the server. Sending the request directly is the only way to be sure the
control is real. They are cheap to run and worth repeating before any release.

### UI and responsiveness (MT-UI)

| ID | Steps | Expected | Result |
|---|---|---|---|
| MT-UI-01 | Open each dashboard page at 375px, 768px and 1440px | Layout holds; no horizontal scroll | |
| MT-UI-02 | Toggle dark mode across the dashboard | All pages readable; contrast preserved | |
| MT-UI-03 | Submit each form with all fields empty | Field-level validation messages appear | |
| MT-UI-04 | Check that new pages reuse the NextAdmin shell, sidebar and cards | Consistent with the template | |

---

## 9. Defects found by testing

### 9.1 Role constant drift — `system_admin` vs `admin` (fixed)

**Found by:** UT-CST-01, UT-CST-11
**Severity:** High — silent authorization failure
**Status:** Fixed

`src/lib/constants.ts` declared:

```ts
export const USER_ROLES = [
  "system_admin", "camp_manager", "org_representative", "independent_initiator",
] as const;
```

The database enum in `src/db/schema/enums.ts` declares something different:

```ts
export const userRole = pgEnum("user_role", [
  "user", "admin", "camp_manager", "org_representative",
  "independent_initiator", "beneficiary",
]);
```

Two independent faults. The administrator is stored as `admin`, and every
protected route compares `session.user.role !== "admin"` — so the literal
`"system_admin"` matches no user who has ever existed. And the list omitted
`user` and `beneficiary` entirely, so two real roles were missing from the
mirror.

The failure this produces is quiet. Any authorization check written against
`USER_ROLES` or the derived `UserRole` type would compile, pass review, and
never match an administrator — either denying admins access or, depending on how
the check was phrased, failing open. Nothing throws. The comment at the top of
the file states these arrays "mirror the PostgreSQL enums", and the mirror was
wrong, which makes the file actively misleading to anyone who trusts it.

The test was written first and observed to fail against the real defect:

```
FAIL  tests/unit/constants.test.ts > UT-CST-01: USER_ROLES matches the user_role database enum
AssertionError: expected [ Array(4) ] to deeply equal [ 'user', 'admin', …(4) ]
- Expected
+ Received
-   "user",
-   "admin",
+   "system_admin",
    "camp_manager",
    "org_representative",
    "independent_initiator",
-   "beneficiary",
```

The fix aligns the constant with the enum, in both values and order, and records
the constraint in a comment. `USER_ROLES` had no consumers outside its own file
at the time, which is why the bug had gone unnoticed — and precisely why it was
worth fixing before it acquired one. UT-CST-01 now fails if the two ever drift
again.

**Related observation, not fixed:** `src/db/migrations/0000_shiny_karnak.sql`
contains the original four-value enum including `system_admin`. The current
schema is correct and later migrations supersede it, but the migration history
is where this drift originated.

### 9.2 Suite validation by mutation testing

A passing suite proves nothing on its own — tests can pass because they assert
nothing meaningful. Two faults were deliberately introduced to confirm the tests
fail when the system is wrong.

**Mutation 1 — boundary operator.** In `buildReceiptUpdate`, `>=` was changed to
`>`, allowing a "partial" receipt of exactly the planned quantity:

```
Tests  3 failed | 110 passed (113)
 × UT-RCP-12: a partial receipt equal to the planned quantity is refused
 × UT-RCP-17: a partial receipt on a single-unit line is impossible
 × IT-RCP-13: a partial receipt of the full planned quantity is rejected with 400
```

Caught at both layers, and only by the three tests that target that boundary.

**Mutation 2 — tenancy bypass.** In the incoming-aid route, the camp assignment
check was weakened from "is this manager assigned to *this line's* camp" to "is
this manager assigned to *any* camp":

```ts
- if (!assigned.includes(found.line.campId)) {
+ if (assigned.length === 0) {
```

This is a cross-tenant data leak: any Camp Manager could confirm any camp's aid.

```
Tests  1 failed | 112 passed (113)
 × IT-RCP-04: a Camp Manager cannot confirm a line for a camp they are not assigned to
```

Exactly one test failed, and it was the right one. IT-RCP-05 (a manager with no
assignment) still passed, correctly — the mutation did not affect that path.
This is the behaviour a suite should have: a targeted failure that names the
broken rule, rather than a wall of red.

Both mutations were reverted. The suite is green at 113/113.

---

## 10. Coverage

Coverage is reported for the modules under test. Whole-repository coverage is
24%, but that number is not informative: it averages in fourteen route files with
no tests yet and a 378-line translation dictionary with no logic in it.

| Module | Stmts | Branch | Note |
|---|---|---|---|
| `src/lib/contributions/receipt.ts` | 100% | 100% | Receipt rules |
| `src/lib/contributions/access.ts` | 100% | 100% | Provider / camp scoping helpers |
| `src/lib/auth/…/permissions.ts` | 100% | 100% | Role matrix |
| `src/lib/constants.ts` | 100% | 100% | Enum mirrors |
| `src/lib/format-number.ts` | 100% | 100% | Formatters |
| `src/utils/timeframe-extractor.ts` | 100% | 100% | Chart timeframes |
| `src/app/api/users/[id]/route.ts` | 100% | 92% | |
| `src/app/api/providers/route.ts` | 84% | 91% | `GET` not covered |
| `src/app/api/incoming-aid/[lineId]/route.ts` | 60% | 96% | `PATCH` covered; `GET` not |
| **Scoped total** | **78%** | **94%** | |

Branch coverage (94%) matters more than statement coverage here. Authorization
is expressed almost entirely as branches — role checks, assignment checks, status
gates — so a branch is a decision the system makes about who may do what. Those
are the lines worth counting.

The 60% on the incoming-aid route is honest and expected: the file holds both
`GET` and `PATCH`, and only `PATCH` is tested. See §11.

---

## 11. Known gaps

Listed so they are decisions rather than oversights, in rough priority order.

1. **`GET /api/incoming-aid/[lineId]` is untested.** The handler deliberately
   returns **404 rather than 403** when the parent contribution is not submitted,
   so an unauthorized caller cannot learn that a line exists. That is a
   thoughtful choice and exactly the kind that gets "simplified" away by someone
   who reads it as a bug. It should be pinned by a test.
2. **The permission matrix is declared but never consulted.** `roles` in
   `permissions.ts` is a complete access-control model, but no route calls it.
   Every route hand-rolls `session.user.role !== "admin"` instead. The two layers
   are tested separately (UT-PRM-\* and IT-\*) and currently agree, but nothing
   forces them to stay in agreement — the matrix could be edited with no effect
   on real behaviour, and a reviewer reading the matrix would draw the wrong
   conclusion about what the system enforces. This is the largest structural risk
   in the codebase and it is a design issue, not a test gap.
3. **Receipt confirmation is not idempotent.** An already-`received` line can be
   confirmed again, or flipped to `rejected`, with no guard and no history. The
   tests document the current behaviour rather than asserting it is correct,
   because whether re-confirmation should be allowed is a product decision. It
   needs one.
4. **`getDashboardStats()` is not role-scoped.** In
   `src/app/(with-layout)/(home)/fetch.ts` it aggregates across all camps
   regardless of caller, and swallows errors into a zeroed result — which means a
   failure renders as "0 families" rather than as an error. Phase 05 requires
   role-scoped dashboards. The function needs its computation extracted from its
   queries before it can be tested properly.
5. **Family routes are untested.** The national-ID uniqueness rule (active
   families only) and the camp-transfer check (both source and target camp) are
   real logic currently covered only by MT-FAM-03 and MT-FAM-04. Both are good
   integration test candidates.
6. **Zod schemas are inline in route files.** Twelve of the thirteen schemas are
   declared as non-exported `const`s inside their handlers, so they can only be
   reached through an HTTP round trip. `confirmSchema` was extracted (§4.4);
   moving the rest to `src/lib/validation/` would make them directly testable.
7. **No UI component tests.** The suite is Node-only. Given that the security
   model is entirely server-side, this is the right trade for now, but form
   validation and empty states rest on the manual plan (MT-UI-\*).
8. **`pnpm lint` is broken.** The script runs `next lint`, which Next.js 16
   removed; it fails with "Invalid project directory". This predates this work
   and is unrelated to testing, but it means the lint step in `CLAUDE.md`'s
   development method currently does nothing. It needs to become an `eslint`
   invocation.

---

## 12. Adding tests

**A new business rule** → a unit test. If the rule is trapped inside a route
handler, extract it to a module first, as §4.4 did for the receipt rules.

**A new endpoint** → an integration test, covering at minimum:

1. anonymous → 401, and no query is run
2. each role that must be refused → 403, **and no write is attempted**
3. each role that is allowed → 200/201
4. tenancy: a Camp Manager must not reach another camp's data
5. invalid input → 400, no write
6. the happy path, asserting what was written

Give every test an ID (`UT-<AREA>-nn` / `IT-<AREA>-nn`), add it to §5 or §6, and
map it to a phase requirement in §7. The ID is what makes a failure traceable
back to the requirement it protects.

**Before delivery:** `pnpm test`, `npx tsc --noEmit`, `pnpm build`, and the §8
manual plan.

---

## 13. Change log

| Change | Detail |
|---|---|
| Test infrastructure added | Vitest 3, `vite-tsconfig-paths`, `@vitest/coverage-v8`; `vitest.config.ts`, `tests/setup.ts`; `test`, `test:watch`, `test:coverage` scripts |
| `pnpm.onlyBuiltDependencies: ["esbuild"]` | pnpm skipped esbuild's build script, which vitest needs to run |
| 113 tests added | 58 unit, 55 integration |
| Test helpers added | `tests/helpers/db-mock.ts`, `tests/helpers/auth-mock.ts` |
| `src/lib/contributions/receipt.ts` extracted | Receipt rules moved out of the route handler; behaviour unchanged |
| **Defect fixed:** `USER_ROLES` | Aligned with the `user_role` enum; see §9.1 |

**Verification:** `pnpm test` → 113/113 passing · `npx tsc --noEmit` → clean ·
`pnpm build` → succeeds.
