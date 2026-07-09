# Roles & Permissions Matrix
# Unified IDP Camp Management System

**Version:** 2.0 (Detailed / Developer-Oriented)
**Status:** Draft for Review
**Date:** 2026
**Related:** BRD (Detailed) v2.0, UI Interface Specification

---

## 1. Permission Model

The system applies **RBAC (Role-Based Access Control)** on two layers:

1. **Action layer:** what the role may do to a resource — `create, read, update, delete, confirm, approve, submit, export`.
2. **Scope layer:** which records the action applies to.

> Separating the two layers ensures — for example — that a Camp Manager edits family data **but only within their camp**, while an Organization Representative reads aggregated data across all camps **without** edit rights.

### Scope Codes

| Code | Meaning |
|---|---|
| `all` | The whole system (global) |
| `camp` | Only the camp(s) assigned to the user |
| `agg` | Read-only aggregated data |
| `verified` | The verified subset published to providers |
| `own` | The user's own records only |
| `self` | The user's own profile only |
| `—` | No permission |

---

## 2. Roles

| Code | Role | Type | Default Scope |
|---|---|---|---|
| **SA** | System Administrator | Internal | `all` |
| **CM** | Camp Manager | Operational | `camp` |
| **OR** | Organization Representative | External, formal | `agg` (read) + `own` (contributions) |
| **AI** | Independent Aid Initiator | External, informal | `verified` + `own` |
| **BN** | Beneficiary (Displaced Person) | External | `own` |

**Notes on the role model:**
- Current assumption: **one primary role per user** (revisable if multi-role is needed).
- A Camp Manager may be assigned to more than one camp; the `camp` scope covers all of their camps.

> **Design Clarification (Intentional Restrictions):**
> - **Camp Manager (CM) cannot create a camp** — `camp.create` is exclusively reserved for the System Administrator (SA). A CM is *assigned* to an existing camp by the SA and cannot self-provision a new one.
> - **Beneficiary (BN) cannot register a family** — `family.create` is exclusively for SA and CM. A beneficiary's family record is always registered *on their behalf* by a Camp Manager.

---

## 3. Permission Matrix by Module

> Values represent the allowed scope. `✓` without a code = full permission within the context.

### 3.1 Auth & Users — Phase P1

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `user.create` | all | — | — | — | — |
| `user.read` | all | — | — | — | — |
| `user.update` | all | — | — | — | — |
| `user.update_self` | self | self | self | self | — |
| `user.deactivate` | all | — | — | — | — |
| `role.assign` | all | — | — | — | — |
| `audit.read` | all | — | — | — | — |
| `login.attempt.read` | all | — | — | — | — |

### 3.2 Camps — Phase P1

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `camp.create` | all | — | — | — | — |
| `camp.read` | all | camp | agg | verified | — |
| `camp.update` | all | camp | — | — | — |
| `camp.delete` (soft) | all | — | — | — | — |
| `camp.assign_manager` | all | — | — | — | — |

### 3.3 Families — Phase P1

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `family.create` | all | camp | — | — | — |
| `family.read` | all | camp | agg | — | — |
| `family.update` | all | camp | — | — | — |
| `family.delete` (soft) | all | camp | — | — | — |
| `family.transfer` *(P2)* | all | camp | — | — | — |

### 3.4 Resources — Phase P1

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `resource.create` | all | camp | — | — | — |
| `resource.read` | all | camp | agg | verified | — |
| `resource.update` | all | camp | — | — | — |
| `resource.delete` (soft) | all | camp | — | — | — |

### 3.5 Distribution — Phase P1

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `distribution.create` | all | camp | — | — | — |
| `distribution.confirm` | all | camp | — | — | — |
| `distribution.read` | all | camp | agg | — | — |
| `distribution.history.read` | all | camp | agg | — | — |

### 3.6 Contributions — Phase P2

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `contribution.create_official` | — | — | own | — | — |
| `contribution.create_independent` | — | — | — | own | — |
| `contribution.read` | all | camp | own | own | — |
| `contribution.receive` (confirm) | all | camp | — | — | — |

### 3.7 Classification & Alerts — Phase P2

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `classification.read` | all | camp | agg | verified | — |
| `alert.read` | all | camp | agg | verified | — |
| `alert.acknowledge` | all | camp | — | — | — |

### 3.8 Feedback — Phase P2

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `complaint.create` | — | — | — | — | own |
| `complaint.read` | all | camp | — | — | own |
| `complaint.update_status` | all | camp | — | — | — |
| `complaint.track` | — | — | — | — | own |

### 3.9 Reporting & Dashboards — Phase P1/P2

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `report.generate` | all | camp | agg | — | — |
| `report.read_aggregated` | all | — | agg | — | — |
| `report.export` *(P2)* | all | camp | agg | — | — |
| `dashboard.view` *(P2)* | all | camp | agg | own | — |

### 3.10 Offline / Sync — Phase P3

| Permission Key | SA | CM | OR | AI | BN |
|---|:---:|:---:|:---:|:---:|:---:|
| `sync.use` | all | camp | — | — | — |
| `sync.conflict.resolve` | all | camp | — | — | — |

---

## 4. Data-Scope Rules

| Code | Rule |
|---|---|
| DS1 | A Camp Manager reads/edits only records of the camp(s) assigned to them |
| DS2 | An Organization Representative gets **read-only aggregated** data without editing personal records |
| DS3 | An Independent Initiator sees only the **verified published** subset (needs/classification/alerts) |
| DS4 | A Beneficiary accesses only **their own reports**, with no access to other camps' or families' data |
| DS5 | A family is linked to exactly one active camp at any time (enforced on create/update) |
| DS6 | Every write operation is attributed to the acting user and recorded in `audit_logs` |
| DS7 | Distribution confirmation and stock decrement are resolved on the **server** to prevent double-spending |

---

## 5. Field-Level & Sensitive Data

- The family head's ID data (`head_id_number`) is a sensitive field: read/written only via `family.*` within `camp`/`all` scope, and never appears in aggregated outputs (`agg`).
- Provider outputs (`agg`/`verified`) are **anonymized**: statistics and counts without individual identifying data.
- A beneficiary's contact data in a complaint is optional and visible only to the relevant Camp Manager (`camp`) and the System Administrator (`all`).

---

## 6. Phase Mapping

| Phase | Enabled Modules | Key Permissions |
|---|---|---|
| **P1 — MVP** | Auth/Users, Camps, Families, Resources, Distribution, Reporting (basic) | `user.*`, `camp.*`, `family.*`, `resource.*`, `distribution.*`, `report.generate` |
| **P2 — Coordination** | Contributions, Classification & Alerts, Feedback, Dashboards & Export | `contribution.*`, `classification.read`, `alert.*`, `complaint.*`, `report.export`, `dashboard.view` |
| **P3 — Offline** | Sync | `sync.use`, `sync.conflict.resolve` |
| **P4 — Expansion** | External integrations, mobile, notifications | (integration permissions defined later) |

---

## 7. Authentication & Session Rules

- Secure authentication before accessing any protected resource (JWT + refresh rotation).
- Passwords stored with bcrypt; tokens as SHA-256 hashes.
- Changing the password or deactivating the account invalidates all sessions immediately.
- A role/permission change takes effect on the next session or on session refresh.
- Sensitive operations (create/delete/permission change/confirm distribution) are recorded in `audit_logs`.

---

## 8. Governance

- Modifying roles or permissions is exclusive to the **System Administrator (SA)**.
- Every permission change is logged (who, what, when).
- Separation of Duties: the administrator manages access and does not do day-to-day operational entry; the camp manager performs operations and does not change access control.

---

## 9. Role Summary (What Each Role Sees/Does)

- **SA:** everything system-wide — managing users and roles, **registering camps** and assigning managers, monitoring logs, comprehensive reports.
- **CM:** full operation of their *assigned* camp — families, resources, distribution, receiving contributions, complaints, camp reports. **Cannot create a new camp** (SA-only action).
- **OR:** aggregated read (statistics/classification/resource availability) + submitting official contributions + coordination reports.
- **AI:** reading verified needs and shortage alerts + submitting independent contributions + tracking them.
- **BN:** submitting and tracking their own reports only.

---

## 10. Developer Appendix: Full Permission Keys Reference

```
# Auth & Users (P1)
user.create, user.read, user.update, user.update_self, user.deactivate,
role.assign, audit.read, login.attempt.read

# Camps (P1)
camp.create, camp.read, camp.update, camp.delete, camp.assign_manager

# Families (P1; family.transfer = P2)
family.create, family.read, family.update, family.delete, family.transfer

# Resources (P1)
resource.create, resource.read, resource.update, resource.delete

# Distribution (P1)
distribution.create, distribution.confirm, distribution.read, distribution.history.read

# Contributions (P2)
contribution.create_official, contribution.create_independent,
contribution.read, contribution.receive

# Classification & Alerts (P2)
classification.read, alert.read, alert.acknowledge

# Feedback (P2)
complaint.create, complaint.read, complaint.update_status, complaint.track

# Reporting (P1/P2)
report.generate, report.read_aggregated, report.export, dashboard.view

# Offline / Sync (P3)
sync.use, sync.conflict.resolve
```

**Role → Permissions map (concise implementation reference):**

- **SA** → all keys above with `all` scope (except the provider-exclusive `contribution.create_*`).
- **CM** → `*.create/read/update/delete` within `camp` for: camps(update), families, resources, distribution, + `contribution.receive`, `complaint.read/update_status`, `alert.acknowledge`, `report.generate(camp)`, `sync.*`.
- **OR** → `camp.read(agg)`, `family.read(agg)`, `resource.read(agg)`, `distribution.read(agg)`, `classification.read(agg)`, `alert.read(agg)`, `contribution.create_official(own)`, `contribution.read(own)`, `report.*(agg)`, `dashboard.view(agg)`.
- **AI** → `camp.read(verified)`, `resource.read(verified)`, `classification.read(verified)`, `alert.read(verified)`, `contribution.create_independent(own)`, `contribution.read(own)`, `dashboard.view(own)`.
- **BN** → `complaint.create(own)`, `complaint.read(own)`, `complaint.track(own)`, `user.update_self`.
