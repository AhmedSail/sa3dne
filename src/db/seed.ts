/**
 * Full demo seed for the Unified IDP Camp Management System.
 *
 * Wipes the operational tables and rebuilds a coherent, Gaza-realistic dataset:
 * shelter sites across the five governorates, displaced families with their
 * members, aid providers, camp-level contributions and their receipt
 * confirmations, camp needs, public complaints, family update requests,
 * notifications and an audit trail — plus a login for every role.
 *
 * The generator is deterministic (fixed PRNG seed), so re-running produces the
 * same IDs, national IDs and tracking numbers. Pass SEED_RANDOM=1 to vary it.
 *
 * Run with: `pnpm db:seed`
 *
 * Business rule reminder: aid is recorded at CAMP level only. Families exist
 * for population statistics and reporting, never as aid recipients.
 */

import { loadEnvConfig } from "@next/env";
import { eq, ne } from "drizzle-orm";

// Load env before importing the db module, which reads DATABASE_URL at import time.
loadEnvConfig(process.cwd());

import type * as Schema from "./schema";
import {
  AID_TYPES,
  CAMPS,
  CAMP_MANAGERS,
  COMPLAINT_TEXTS,
  CONFIRMATION_NOTES,
  CONTRIBUTION_NOTES,
  FAMILY_NAMES,
  FAMILY_NOTES,
  FEMALE_NAMES,
  INACTIVE_FAMILY_REASONS,
  LINE_REJECTION_REASONS,
  MALE_NAMES,
  NOT_RECEIVED_NOTES,
  OCCUPATIONS,
  PARTIAL_NOTES,
  PROVIDERS,
  REJECTION_REASONS,
  REQUEST_NOTES,
  RESOLUTION_NOTES,
  RESPONSE_NOTES,
} from "./seed-data";

type NewUser = typeof Schema.user.$inferInsert;
type NewAccount = typeof Schema.account.$inferInsert;
type NewCamp = typeof Schema.camp.$inferInsert;
type NewCampAssignment = typeof Schema.campAssignment.$inferInsert;
type NewFamily = typeof Schema.family.$inferInsert;
type NewFamilyMember = typeof Schema.familyMember.$inferInsert;
type NewAidType = typeof Schema.aidType.$inferInsert;
type NewProvider = typeof Schema.aidProvider.$inferInsert;
type NewContribution = typeof Schema.aidContribution.$inferInsert;
type NewContributionLine = typeof Schema.aidContributionLine.$inferInsert;
type NewAidRequest = typeof Schema.aidRequest.$inferInsert;
type NewAidRequestResponse = typeof Schema.aidRequestResponse.$inferInsert;
type NewComplaint = typeof Schema.complaints.$inferInsert;
type NewFamilyRequest = typeof Schema.familyUpdateRequest.$inferInsert;
type NewNotification = typeof Schema.notification.$inferInsert;
type NewAuditLog = typeof Schema.auditLog.$inferInsert;

/* -------------------------------------------------------------------------- */
/* Deterministic randomness                                                    */
/* -------------------------------------------------------------------------- */

/** mulberry32 — small, fast, and reproducible across runs. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(process.env.SEED_RANDOM ? Date.now() & 0xffffffff : 20260817);

const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;

/** Picks a value from `options` using the matching weight in `weights`. */
function weighted<T>(options: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rand() * total;
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return options[i];
  }
  return options[options.length - 1];
}

/** Returns `count` distinct members of `arr` (or all of them if it is shorter). */
function sample<T>(arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Time helpers                                                                */
/* -------------------------------------------------------------------------- */

const NOW = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;

/** `n` days before now (negative `n` gives a future date), at a plausible hour. */
function daysAgo(n: number, hour = randInt(7, 19)) {
  const d = new Date(NOW.getTime() - n * DAY_MS);
  d.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
  return d;
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
const isPast = (d: Date) => d.getTime() < NOW.getTime();

/* -------------------------------------------------------------------------- */
/* Identifiers                                                                 */
/* -------------------------------------------------------------------------- */

const counters: Record<string, number> = {};
/** Readable, stable primary keys — nicer than UUIDs in demo URLs. */
const uid = (prefix: string) => {
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  return `${prefix}_${String(counters[prefix]).padStart(4, "0")}`;
};

const usedNationalIds = new Set<string>();
/** Palestinian ID numbers are 9 digits; these are synthetic but well-formed. */
function nationalId() {
  for (;;) {
    const id = String(randInt(400000000, 999999999));
    if (!usedNationalIds.has(id)) {
      usedNationalIds.add(id);
      return id;
    }
  }
}

const usedPhones = new Set<string>();
function phone() {
  for (;;) {
    const p = `+9705${pick(["9", "6", "7"])}${String(randInt(1000000, 9999999))}`;
    if (!usedPhones.has(p)) {
      usedPhones.add(p);
      return p;
    }
  }
}

const usedTracking = new Set<string>();
function trackingNumber(date: Date) {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  for (;;) {
    const suffix = randInt(0, 36 ** 4 - 1)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
    const tn = `CMP-${stamp}-${suffix}`;
    if (!usedTracking.has(tn)) {
      usedTracking.add(tn);
      return tn;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  const { db } = await import("./index");
  const s = await import("./schema");
  const { hashPassword } = await import("better-auth/crypto");

  /** Inserts in chunks so we never approach the Postgres parameter limit. */
  async function insertMany<T>(label: string, table: unknown, rows: T[], size = 300) {
    for (let i = 0; i < rows.length; i += size) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(table as any).values(rows.slice(i, i + size) as any);
    }
    console.log(`   ✓ ${label}: ${rows.length}`);
  }

  /* ---------------------------------------------------------------------- */
  /* 0. Wipe                                                                 */
  /* ---------------------------------------------------------------------- */

  console.log("🧹 Clearing existing data…");

  await db.delete(s.notification);
  await db.delete(s.auditLog);
  await db.delete(s.familyUpdateRequest);
  await db.delete(s.complaints);
  await db.delete(s.aidRequestResponse);
  await db.delete(s.aidRequest);
  await db.delete(s.aidContributionLine);
  await db.delete(s.aidContribution);
  await db.delete(s.familyMember);
  await db.delete(s.family);
  await db.delete(s.campAssignment);
  await db.delete(s.aidProvider);
  await db.delete(s.aidType);

  /* ---------------------------------------------------------------------- */
  /* 1. Admin (re-used when it already exists, so open sessions survive)     */
  /* ---------------------------------------------------------------------- */

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sa3dne.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const adminName = process.env.SEED_ADMIN_NAME ?? "مدير النظام";

  const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? "Manager@12345";
  const providerPassword = process.env.SEED_PROVIDER_PASSWORD ?? "Provider@12345";
  const beneficiaryPassword = process.env.SEED_BENEFICIARY_PASSWORD ?? "Family@12345";

  const [managerHash, providerHash, beneficiaryHash] = await Promise.all([
    hashPassword(managerPassword),
    hashPassword(providerPassword),
    hashPassword(beneficiaryPassword),
  ]);

  const existingAdmin = await db.select().from(s.user).where(eq(s.user.email, adminEmail));

  let adminId: string;

  if (existingAdmin.length > 0) {
    adminId = existingAdmin[0].id;
    await db.delete(s.session).where(ne(s.session.userId, adminId));
    await db.delete(s.account).where(ne(s.account.userId, adminId));
    await db.delete(s.user).where(ne(s.user.id, adminId));
    await db.update(s.user).set({ campId: null }).where(eq(s.user.id, adminId));
    console.log(`ℹ️  Re-using existing admin (${adminEmail}) — password unchanged.`);
  } else {
    await db.delete(s.session);
    await db.delete(s.account);
    await db.delete(s.user);

    adminId = uid("usr");
    await db.insert(s.user).values({
      id: adminId,
      name: adminName,
      email: adminEmail,
      emailVerified: true,
      role: "admin",
      banned: false,
      createdAt: daysAgo(210),
      updatedAt: daysAgo(210),
    });
    await db.insert(s.account).values({
      id: uid("acc"),
      accountId: adminId,
      providerId: "credential",
      userId: adminId,
      password: await hashPassword(adminPassword),
      createdAt: daysAgo(210),
      updatedAt: daysAgo(210),
    });
    console.log(`✅ Admin created (${adminEmail} / ${adminPassword})`);
  }

  // Camps must be cleared after users, since user.camp_id references them.
  await db.delete(s.camp);

  /* ---------------------------------------------------------------------- */
  /* 2. Camps                                                                */
  /* ---------------------------------------------------------------------- */

  console.log("🏕️  Seeding camps…");

  const campIdByKey = new Map<string, string>();
  const campRows: NewCamp[] = CAMPS.map((c, i) => {
    const id = uid("camp");
    campIdByKey.set(c.key, id);
    const createdAt = daysAgo(200 - i * 4);
    return {
      id,
      name: c.name,
      location: c.location,
      capacity: c.capacity,
      operationalStatus: c.operationalStatus,
      needLevel: c.needLevel,
      notes: c.notes,
      status: c.status,
      createdAt,
      updatedAt: daysAgo(randInt(1, 20)),
    };
  });
  await insertMany("camps", s.camp, campRows);

  const activeCampKeys = CAMPS.filter((c) => c.status === "active").map((c) => c.key);
  const campId = (key: string) => campIdByKey.get(key)!;

  /* ---------------------------------------------------------------------- */
  /* 3. Camp managers + assignments                                          */
  /* ---------------------------------------------------------------------- */

  console.log("👤 Seeding camp managers…");

  const userRows: NewUser[] = [];
  const accountRows: NewAccount[] = [];
  const assignmentRows: NewCampAssignment[] = [];

  /** manager user id -> the camp ids they are scoped to */
  const managerCamps = new Map<string, string[]>();
  /** camp id -> manager user ids that can confirm receipts there */
  const campManagers = new Map<string, string[]>();

  for (const m of CAMP_MANAGERS) {
    const id = uid("usr");
    const createdAt = daysAgo(randInt(150, 195));
    userRows.push({
      id,
      name: m.name,
      email: m.email,
      emailVerified: true,
      phone: m.phone,
      campId: campId(m.camps[0]),
      role: "camp_manager",
      banned: false,
      createdAt,
      updatedAt: createdAt,
    });
    accountRows.push({
      id: uid("acc"),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: managerHash,
      createdAt,
      updatedAt: createdAt,
    });

    const ids = m.camps.map(campId);
    managerCamps.set(id, ids);
    for (const cid of ids) {
      assignmentRows.push({ id: uid("asg"), campId: cid, userId: id, createdAt });
      campManagers.set(cid, [...(campManagers.get(cid) ?? []), id]);
    }
  }

  /** A manager who can act on this camp, falling back to the admin. */
  const reviewerFor = (cid: string) => {
    const mgrs = campManagers.get(cid);
    return mgrs && mgrs.length > 0 ? pick(mgrs) : adminId;
  };

  /* ---------------------------------------------------------------------- */
  /* 4. Providers + their logins                                             */
  /* ---------------------------------------------------------------------- */

  console.log("🤝 Seeding aid providers…");

  const providerRows: NewProvider[] = [];
  const providerIdByKey = new Map<string, string>();
  /** provider id -> linked user id (only for providers that have a login) */
  const providerUser = new Map<string, string>();

  for (const p of PROVIDERS) {
    const id = uid("prv");
    providerIdByKey.set(p.key, id);
    const createdAt = daysAgo(randInt(120, 190));

    let linkedUserId: string | null = null;
    if (p.login) {
      linkedUserId = uid("usr");
      userRows.push({
        id: linkedUserId,
        name: p.login.name,
        email: p.login.email,
        emailVerified: true,
        phone: p.phone,
        role: p.login.role,
        banned: false,
        createdAt,
        updatedAt: createdAt,
      });
      accountRows.push({
        id: uid("acc"),
        accountId: linkedUserId,
        providerId: "credential",
        userId: linkedUserId,
        password: providerHash,
        createdAt,
        updatedAt: createdAt,
      });
      providerUser.set(id, linkedUserId);
    }

    providerRows.push({
      id,
      type: p.type,
      name: p.name,
      contactPerson: p.contactPerson,
      phone: p.phone,
      email: p.email,
      notes: p.notes,
      linkedUserId,
      status: p.status,
      createdAt,
      updatedAt: daysAgo(randInt(1, 40)),
    });
  }

  const activeProviders = PROVIDERS.filter((p) => p.status === "active").map((p) =>
    providerIdByKey.get(p.key)!,
  );

  /* ---------------------------------------------------------------------- */
  /* 5. Aid types                                                            */
  /* ---------------------------------------------------------------------- */

  const aidTypeIdByKey = new Map<string, string>();
  const aidTypeRows: NewAidType[] = AID_TYPES.map((a, i) => {
    const id = uid("aid");
    aidTypeIdByKey.set(a.key, id);
    const createdAt = daysAgo(198 - i);
    return {
      id,
      name: a.name,
      category: a.category,
      defaultUnit: a.defaultUnit,
      status: a.status,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const activeAidTypes = AID_TYPES.filter((a) => a.status === "active");

  /* ---------------------------------------------------------------------- */
  /* 6. Families + members                                                   */
  /* ---------------------------------------------------------------------- */

  console.log("👨‍👩‍👧‍👦 Seeding families and members…");

  const EDUCATION = [
    "edu_none",
    "edu_elementary",
    "edu_preparatory",
    "edu_secondary",
    "edu_university",
    "edu_post_graduate",
  ] as const;

  function educationForAge(age: number) {
    if (age < 6) return "edu_none";
    if (age < 12) return "edu_elementary";
    if (age < 15) return "edu_preparatory";
    if (age < 18) return "edu_secondary";
    return weighted(EDUCATION, [8, 10, 14, 34, 28, 6]);
  }

  const birthDateForAge = (age: number) =>
    new Date(NOW.getFullYear() - age, randInt(0, 11), randInt(1, 28));

  const familyRows: NewFamily[] = [];
  const memberRows: NewFamilyMember[] = [];
  /** family id -> its member ids, used later for family update requests */
  const familyMembers = new Map<string, string[]>();
  /** Active families, kept for picking beneficiaries and complaint authors. */
  const activeFamilies: {
    id: string;
    campKey: string;
    campId: string;
    headName: string;
    nationalId: string;
    phone: string;
  }[] = [];

  for (const c of CAMPS) {
    const cid = campId(c.key);
    for (let i = 0; i < c.families; i++) {
      const surname = pick(FAMILY_NAMES);
      const headIsWidow = chance(0.14);
      const headFirst = headIsWidow ? pick(FEMALE_NAMES) : pick(MALE_NAMES);
      const headMiddle = pick(MALE_NAMES);
      const headName = `${headFirst} ${headMiddle} ${surname}`;
      const headAge = randInt(27, 68);

      // Household sizes in Gaza skew large; 1-person households are rare.
      const memberCount = weighted(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        [2, 6, 10, 15, 18, 16, 13, 9, 6, 3, 2],
      );

      const inactive = c.operationalStatus === "closed" ? chance(0.4) : chance(0.04);
      const nid = nationalId();
      const ph = phone();
      const fid = uid("fam");
      const createdAt = daysAgo(randInt(5, 185));

      familyRows.push({
        id: fid,
        campId: cid,
        headName,
        nationalId: nid,
        phone: ph,
        memberCount,
        occupation: headIsWidow ? pick(["ربة منزل", "خياطة", "معلمة مدرسة"]) : pick(OCCUPATIONS),
        notes: chance(0.75) ? pick(FAMILY_NOTES) : null,
        status: inactive ? "inactive" : "active",
        inactiveReason: inactive ? pick(INACTIVE_FAMILY_REASONS) : null,
        createdAt,
        updatedAt: chance(0.4) ? daysAgo(randInt(1, 30)) : createdAt,
      });

      if (!inactive) {
        activeFamilies.push({ id: fid, campKey: c.key, campId: cid, headName, nationalId: nid, phone: ph });
      }

      // Members exclude the head, who is stored on the family row itself.
      const ids: string[] = [];
      let remaining = memberCount - 1;

      if (remaining > 0 && !headIsWidow && chance(0.92)) {
        const wifeAge = Math.max(20, headAge - randInt(0, 8));
        const mid = uid("mem");
        ids.push(mid);
        memberRows.push({
          id: mid,
          familyId: fid,
          nationalId: nationalId(),
          name: `${pick(FEMALE_NAMES)} ${pick(MALE_NAMES)} ${surname}`,
          relationship: "wife",
          educationLevel: educationForAge(wifeAge),
          gender: "female",
          birthDate: birthDateForAge(wifeAge),
          createdAt,
          updatedAt: createdAt,
        });
        remaining--;
      }

      // An elderly parent or a displaced relative sharing the tent.
      if (remaining > 1 && chance(0.18)) {
        const relAge = randInt(60, 86);
        const isFemale = chance(0.55);
        const mid = uid("mem");
        ids.push(mid);
        memberRows.push({
          id: mid,
          familyId: fid,
          nationalId: nationalId(),
          name: `${isFemale ? pick(FEMALE_NAMES) : pick(MALE_NAMES)} ${pick(MALE_NAMES)} ${surname}`,
          relationship: "other",
          educationLevel: educationForAge(relAge),
          gender: isFemale ? "female" : "male",
          birthDate: birthDateForAge(relAge),
          createdAt,
          updatedAt: createdAt,
        });
        remaining--;
      }

      const maxChildAge = Math.max(2, Math.min(26, headAge - 22));
      for (let k = 0; k < remaining; k++) {
        const childAge = randInt(0, maxChildAge);
        const isDaughter = chance(0.5);
        const mid = uid("mem");
        ids.push(mid);
        memberRows.push({
          id: mid,
          familyId: fid,
          nationalId: childAge >= 16 ? nationalId() : null,
          name: `${isDaughter ? pick(FEMALE_NAMES) : pick(MALE_NAMES)} ${headFirst} ${surname}`,
          relationship: isDaughter ? "daughter" : "son",
          educationLevel: educationForAge(childAge),
          gender: isDaughter ? "female" : "male",
          birthDate: birthDateForAge(childAge),
          createdAt,
          updatedAt: createdAt,
        });
      }

      familyMembers.set(fid, ids);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* 7. Beneficiary logins                                                   */
  /* ---------------------------------------------------------------------- */

  // The app resolves a beneficiary's family from `<nationalId>@sa3dne.local`.
  const beneficiaryFamilies = sample(
    activeFamilies.filter((f) => f.campKey !== "shaboura_closed"),
    14,
  );

  const beneficiaryUserByFamily = new Map<string, string>();

  for (const f of beneficiaryFamilies) {
    const id = uid("usr");
    beneficiaryUserByFamily.set(f.id, id);
    const createdAt = daysAgo(randInt(10, 120));
    userRows.push({
      id,
      name: f.headName,
      email: `${f.nationalId}@sa3dne.local`,
      emailVerified: true,
      phone: f.phone,
      campId: f.campId,
      role: "beneficiary",
      banned: false,
      createdAt,
      updatedAt: createdAt,
    });
    accountRows.push({
      id: uid("acc"),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: beneficiaryHash,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // One deactivated staff account, so the users screen has a banned row to show.
  const bannedId = uid("usr");
  userRows.push({
    id: bannedId,
    name: "زياد أبو شمالة (حساب موقوف)",
    email: "former.manager@sa3dne.com",
    emailVerified: true,
    phone: phone(),
    role: "camp_manager",
    banned: true,
    banReason: "انتهاء التكليف وانتقال الموظف خارج نطاق العمل.",
    createdAt: daysAgo(160),
    updatedAt: daysAgo(35),
  });
  accountRows.push({
    id: uid("acc"),
    accountId: bannedId,
    providerId: "credential",
    userId: bannedId,
    password: managerHash,
    createdAt: daysAgo(160),
    updatedAt: daysAgo(35),
  });

  await insertMany("users", s.user, userRows);
  await insertMany("credentials", s.account, accountRows);
  await insertMany("camp assignments", s.campAssignment, assignmentRows);
  await insertMany("aid providers", s.aidProvider, providerRows);
  await insertMany("aid types", s.aidType, aidTypeRows);
  await insertMany("families", s.family, familyRows);
  await insertMany("family members", s.familyMember, memberRows);

  /* ---------------------------------------------------------------------- */
  /* 8. Contributions + camp-level lines                                     */
  /* ---------------------------------------------------------------------- */

  console.log("📦 Seeding contributions and receipts…");

  const contributionRows: NewContribution[] = [];
  const lineRows: NewContributionLine[] = [];
  /** Lines a provider can be notified about later. */
  const confirmedLines: { lineId: string; providerId: string; campId: string; status: string; at: Date }[] = [];
  const submittedContributions: { id: string; providerId: string; campIds: string[]; at: Date }[] = [];

  for (const p of PROVIDERS) {
    const pid = providerIdByKey.get(p.key)!;
    const author = providerUser.get(pid) ?? adminId;
    const count = p.status === "inactive" ? 1 : p.type === "organization" ? randInt(3, 6) : randInt(2, 4);

    for (let i = 0; i < count; i++) {
      const createdAt = daysAgo(randInt(3, 120));
      const status = weighted(["submitted", "draft", "cancelled"] as const, [76, 17, 7]);
      const cid = uid("con");
      const submittedAt = status === "draft" ? null : addDays(createdAt, randInt(0, 2));

      contributionRows.push({
        id: cid,
        providerId: pid,
        status,
        notes: status === "draft" ? pick(CONTRIBUTION_NOTES.slice(5)) : pick(CONTRIBUTION_NOTES),
        submittedAt,
        createdById: author,
        createdAt,
        updatedAt: submittedAt ?? createdAt,
      });

      // Each line is one camp receiving one aid type — never a family.
      const targetCampKeys = sample(activeCampKeys, randInt(1, 4));
      const usedPairs = new Set<string>();
      const touchedCamps: string[] = [];

      for (const key of targetCampKeys) {
        const camp = campId(key);
        const type = pick(activeAidTypes);
        const pairKey = `${camp}:${type.key}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);
        touchedCamps.push(camp);

        const planned = randInt(type.qty[0], type.qty[1]);
        const deliveryDate = addDays(createdAt, randInt(2, 25));
        const lineId = uid("lin");

        let lineStatus: NewContributionLine["status"] = "pending";
        let actualReceivedQuantity: number | null = null;
        let actualReceiptDate: Date | null = null;
        let confirmationNotes: string | null = null;
        let rejectionReason: string | null = null;
        let confirmedById: string | null = null;
        let confirmedAt: Date | null = null;

        if (status === "submitted" && isPast(deliveryDate)) {
          lineStatus = weighted(
            ["received", "partially_received", "not_received", "rejected"] as const,
            [64, 20, 9, 7],
          );
          confirmedAt = addDays(deliveryDate, randInt(0, 3));
          confirmedById = reviewerFor(camp);

          if (lineStatus === "received") {
            actualReceivedQuantity = planned;
            actualReceiptDate = confirmedAt;
            confirmationNotes = pick(CONFIRMATION_NOTES);
          } else if (lineStatus === "partially_received") {
            actualReceivedQuantity = Math.max(1, Math.round(planned * (0.35 + rand() * 0.45)));
            actualReceiptDate = confirmedAt;
            confirmationNotes = pick(PARTIAL_NOTES);
          } else if (lineStatus === "not_received") {
            actualReceivedQuantity = 0;
            confirmationNotes = pick(NOT_RECEIVED_NOTES);
          } else {
            actualReceivedQuantity = 0;
            rejectionReason = pick(LINE_REJECTION_REASONS);
          }

          confirmedLines.push({ lineId, providerId: pid, campId: camp, status: lineStatus, at: confirmedAt });
        }

        lineRows.push({
          id: lineId,
          contributionId: cid,
          campId: camp,
          aidTypeId: aidTypeIdByKey.get(type.key)!,
          plannedQuantity: planned,
          unit: type.defaultUnit,
          plannedDeliveryDate: deliveryDate,
          status: lineStatus,
          actualReceivedQuantity,
          actualReceiptDate,
          confirmationNotes,
          rejectionReason,
          confirmedById,
          confirmedAt,
          createdAt,
          updatedAt: confirmedAt ?? createdAt,
        });
      }

      if (status === "submitted" && submittedAt) {
        submittedContributions.push({ id: cid, providerId: pid, campIds: touchedCamps, at: submittedAt });
      }
    }
  }

  await insertMany("contributions", s.aidContribution, contributionRows);
  await insertMany("contribution lines", s.aidContributionLine, lineRows);

  /* ---------------------------------------------------------------------- */
  /* 9. Camp aid requests + provider responses                               */
  /* ---------------------------------------------------------------------- */

  console.log("📣 Seeding camp aid requests…");

  const requestRows: NewAidRequest[] = [];
  const responseRows: NewAidRequestResponse[] = [];

  for (const key of activeCampKeys) {
    const camp = campId(key);
    const campMeta = CAMPS.find((c) => c.key === key)!;
    const total = campMeta.needLevel === "critical" ? randInt(3, 4) : randInt(1, 3);

    // Only the newest request stays open — the rule allows one live request per
    // camp per day, so each request is placed on its own day.
    const dayOffsets = sample([1, 4, 8, 13, 19, 26, 34, 45, 58, 72], total).sort((a, b) => b - a);

    dayOffsets.forEach((offset, index) => {
      const createdAt = daysAgo(offset);
      const type = pick(activeAidTypes);
      const requested = randInt(type.qty[0], type.qty[1]);
      const isNewest = index === dayOffsets.length - 1;

      const status = isNewest
        ? weighted(["open", "in_progress"] as const, [55, 45])
        : weighted(["fulfilled", "cancelled"] as const, [82, 18]);

      const rid = uid("req");
      let fulfilled = 0;

      if (status !== "cancelled") {
        const responders = sample(activeProviders, status === "fulfilled" ? randInt(1, 3) : randInt(0, 2));
        const shares = responders.length;

        responders.forEach((prov, i) => {
          const remaining = requested - fulfilled;
          const committed =
            status === "fulfilled" && i === shares - 1
              ? Math.max(1, remaining)
              : Math.max(1, Math.round(remaining * (0.3 + rand() * 0.4)));
          fulfilled += committed;

          responseRows.push({
            id: uid("rsp"),
            requestId: rid,
            providerId: prov,
            committedQuantity: committed,
            notes: pick(RESPONSE_NOTES),
            status: "committed",
            respondedById: providerUser.get(prov) ?? adminId,
            createdAt: addDays(createdAt, randInt(0, 3)),
            updatedAt: addDays(createdAt, randInt(0, 3)),
          });
        });

        if (status === "fulfilled") fulfilled = Math.max(fulfilled, requested);
        fulfilled = Math.min(fulfilled, requested);
      }

      requestRows.push({
        id: rid,
        campId: camp,
        aidTypeId: aidTypeIdByKey.get(type.key)!,
        requestedQuantity: requested,
        fulfilledQuantity: fulfilled,
        unit: type.defaultUnit,
        urgencyLevel:
          campMeta.needLevel === "critical"
            ? weighted(["critical", "high"] as const, [65, 35])
            : weighted(["high", "medium", "low"] as const, [40, 45, 15]),
        notes: chance(0.7) ? pick(REQUEST_NOTES) : null,
        status,
        requestedById: reviewerFor(camp),
        createdAt,
        updatedAt: daysAgo(Math.max(0, offset - randInt(0, 2))),
      });
    });
  }

  await insertMany("aid requests", s.aidRequest, requestRows);
  await insertMany("request responses", s.aidRequestResponse, responseRows);

  /* ---------------------------------------------------------------------- */
  /* 10. Complaints                                                          */
  /* ---------------------------------------------------------------------- */

  console.log("📨 Seeding complaints…");

  const complaintRows: NewComplaint[] = [];
  const COMPLAINT_COUNT = 96;

  for (let i = 0; i < COMPLAINT_COUNT; i++) {
    const author = pick(activeFamilies);
    const type = weighted(["complaint", "suggestion", "unmet_need"] as const, [52, 18, 30]);
    const createdAt = daysAgo(randInt(0, 90));
    const status = weighted(
      ["pending", "in_review", "resolved", "rejected"] as const,
      [26, 18, 44, 12],
    );

    const reviewed = status === "resolved" || status === "rejected" || status === "in_review";
    const reviewedAt = reviewed ? addDays(createdAt, randInt(1, 7)) : null;

    complaintRows.push({
      id: uid("cmp"),
      trackingNumber: trackingNumber(createdAt),
      campId: author.campId,
      type,
      // Public submissions are sometimes anonymous.
      beneficiaryName: chance(0.12) ? "مقدّم بلاغ غير معرّف" : author.headName,
      phone: chance(0.85) ? author.phone : null,
      details: pick(COMPLAINT_TEXTS[type]),
      status,
      resolutionNotes: status === "resolved" ? pick(RESOLUTION_NOTES) : null,
      rejectionReason: status === "rejected" ? pick(REJECTION_REASONS) : null,
      reviewedById: reviewed ? reviewerFor(author.campId) : null,
      reviewedAt: reviewedAt && isPast(reviewedAt) ? reviewedAt : reviewed ? createdAt : null,
      createdAt,
      updatedAt: reviewedAt && isPast(reviewedAt) ? reviewedAt : createdAt,
    });
  }

  await insertMany("complaints", s.complaints, complaintRows);

  /* ---------------------------------------------------------------------- */
  /* 11. Family update requests                                             */
  /* ---------------------------------------------------------------------- */

  console.log("📝 Seeding family update requests…");

  const familyRequestRows: NewFamilyRequest[] = [];

  beneficiaryFamilies.forEach((f, idx) => {
    const requesterId = beneficiaryUserByFamily.get(f.id)!;
    const members = familyMembers.get(f.id) ?? [];
    // Only the first few families keep a pending request — the server allows
    // one pending request per family at a time.
    const history = idx < 5 ? randInt(1, 2) : randInt(0, 2);

    for (let i = 0; i < history; i++) {
      const isPending = idx < 5 && i === history - 1;
      const drawn = weighted(
        ["add_member", "update_family_info", "update_member", "remove_member"] as const,
        [34, 32, 22, 12],
      );
      // A member-scoped request is meaningless for a single-person household.
      const type =
        members.length === 0 && (drawn === "update_member" || drawn === "remove_member")
          ? "update_family_info"
          : drawn;

      let payload: Record<string, unknown>;
      if (type === "add_member") {
        const isFemale = chance(0.5);
        const age = randInt(0, 3);
        payload = {
          member: {
            name: `${isFemale ? pick(FEMALE_NAMES) : pick(MALE_NAMES)} ${f.headName.split(" ").slice(-2).join(" ")}`,
            relationship: isFemale ? "daughter" : "son",
            educationLevel: "edu_none",
            gender: isFemale ? "female" : "male",
            birthDate: birthDateForAge(age).toISOString(),
            nationalId: null,
          },
        };
      } else if (type === "update_family_info") {
        payload = {
          fields: {
            phone: phone(),
            notes: pick(FAMILY_NOTES),
          },
        };
      } else if (type === "update_member") {
        payload = {
          memberId: pick(members),
          fields: { educationLevel: pick(EDUCATION) },
        };
      } else {
        payload = { memberId: pick(members) };
      }

      const createdAt = daysAgo(isPending ? randInt(1, 9) : randInt(15, 100));
      const status = isPending
        ? ("pending" as const)
        : weighted(["approved", "rejected"] as const, [72, 28]);

      familyRequestRows.push({
        id: uid("frq"),
        familyId: f.id,
        requestedById: requesterId,
        type,
        payload,
        status,
        rejectionReason:
          status === "rejected"
            ? pick([
                "المستندات المرفقة غير كافية لإثبات التعديل المطلوب.",
                "البيانات المدخلة لا تطابق السجل الرسمي للعائلة.",
                "تم رفض الطلب لتكراره مع طلب سابق تمت معالجته.",
              ])
            : null,
        reviewedById: status === "pending" ? null : reviewerFor(f.campId),
        reviewedAt: status === "pending" ? null : addDays(createdAt, randInt(1, 6)),
        createdAt,
        updatedAt: createdAt,
      });
    }
  });

  await insertMany("family update requests", s.familyUpdateRequest, familyRequestRows);

  /* ---------------------------------------------------------------------- */
  /* 12. Notifications                                                       */
  /* ---------------------------------------------------------------------- */

  console.log("🔔 Seeding notifications…");

  const notificationRows: NewNotification[] = [];
  const providerNameById = new Map(providerRows.map((p) => [p.id as string, p.name as string]));
  const campNameById = new Map(campRows.map((c) => [c.id as string, c.name as string]));

  // Managers hear about submissions landing on their camps.
  for (const c of sample(submittedContributions, Math.min(30, submittedContributions.length))) {
    const recipients = new Set<string>();
    for (const cid of c.campIds) for (const m of campManagers.get(cid) ?? []) recipients.add(m);
    if (recipients.size === 0) recipients.add(adminId);

    for (const userId of recipients) {
      notificationRows.push({
        id: uid("ntf"),
        userId,
        title: "مساهمة جديدة بانتظار تأكيد الاستلام",
        message: `قدّمت ${providerNameById.get(c.providerId)} مساهمة تشمل مواقع ضمن نطاقك. يرجى مراجعة البنود وتأكيد الاستلام.`,
        entityType: "aid_contribution",
        entityId: c.id,
        link: `/dashboard/incoming-aid`,
        status: chance(0.55) ? "read" : "unread",
        createdAt: c.at,
        readAt: null,
      });
    }
  }

  // Providers hear back when a camp manager confirms or rejects a line.
  for (const line of sample(confirmedLines, Math.min(28, confirmedLines.length))) {
    const userId = providerUser.get(line.providerId);
    if (!userId) continue;
    const label: Record<string, string> = {
      received: "تم تأكيد استلام مساهمتكم بالكامل",
      partially_received: "تم استلام جزء من مساهمتكم",
      not_received: "لم تصل مساهمتكم إلى الموقع",
      rejected: "تم رفض بند من مساهمتكم",
    };
    notificationRows.push({
      id: uid("ntf"),
      userId,
      title: label[line.status] ?? "تحديث على حالة الاستلام",
      message: `تم تحديث حالة الاستلام في «${campNameById.get(line.campId)}».`,
      entityType: "aid_contribution_line",
      entityId: line.lineId,
      link: `/dashboard/contributions`,
      status: chance(0.5) ? "read" : "unread",
      createdAt: line.at,
      readAt: null,
    });
  }

  // Managers hear about new complaints on their camps.
  for (const c of sample(
    complaintRows.filter((c) => c.status === "pending"),
    14,
  )) {
    const userId = reviewerFor(c.campId as string);
    notificationRows.push({
      id: uid("ntf"),
      userId,
      title: "بلاغ جديد من المستفيدين",
      message: `ورد بلاغ جديد (${c.trackingNumber}) في «${campNameById.get(c.campId as string)}» بانتظار المراجعة.`,
      entityType: "complaint",
      entityId: c.id as string,
      link: `/dashboard/complaints/${c.id}`,
      status: "unread",
      createdAt: c.createdAt as Date,
      readAt: null,
    });
  }

  // Beneficiaries hear back on their own family requests.
  for (const r of familyRequestRows.filter((r) => r.status !== "pending").slice(0, 12)) {
    notificationRows.push({
      id: uid("ntf"),
      userId: r.requestedById as string,
      title: r.status === "approved" ? "تمت الموافقة على طلب تحديث بياناتك" : "تم رفض طلب تحديث بياناتك",
      message:
        r.status === "approved"
          ? "اعتمدت إدارة الموقع التعديل المطلوب على بيانات عائلتك."
          : `تم رفض الطلب. السبب: ${r.rejectionReason}`,
      entityType: "family_update_request",
      entityId: r.id as string,
      link: "/dashboard/my-family",
      status: chance(0.6) ? "read" : "unread",
      createdAt: (r.reviewedAt as Date) ?? (r.createdAt as Date),
      readAt: null,
    });
  }

  for (const n of notificationRows) {
    if (n.status === "read") n.readAt = addDays(n.createdAt as Date, randInt(0, 2));
  }

  await insertMany("notifications", s.notification, notificationRows);

  /* ---------------------------------------------------------------------- */
  /* 13. Audit trail                                                         */
  /* ---------------------------------------------------------------------- */

  console.log("🗂️  Seeding audit log…");

  const auditRows: NewAuditLog[] = [];
  const IPS = ["10.12.4.18", "10.12.4.51", "192.168.60.22", "41.87.16.204", "80.90.10.7"];
  const AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-A536B) Chrome/130.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Version/17.5 Mobile Safari/605.1",
  ];

  const audit = (
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    createdAt: Date,
    oldValueJson: unknown = null,
    newValueJson: unknown = null,
  ) =>
    auditRows.push({
      id: uid("aud"),
      userId,
      action,
      entityType,
      entityId,
      oldValueJson,
      newValueJson,
      ipAddress: pick(IPS),
      userAgent: pick(AGENTS),
      createdAt,
    });

  for (const c of campRows) {
    audit(adminId, "camp.create", "camp", c.id as string, c.createdAt as Date, null, {
      name: c.name,
      location: c.location,
      capacity: c.capacity,
    });
  }
  for (const u of sample(userRows, 16)) {
    audit(adminId, "user.create", "user", u.id as string, u.createdAt as Date, null, {
      name: u.name,
      email: u.email,
      role: u.role,
    });
  }
  for (const p of sample(providerRows, 10)) {
    audit(adminId, "provider.create", "aid_provider", p.id as string, p.createdAt as Date, null, {
      name: p.name,
      type: p.type,
    });
  }
  for (const a of sample(aidTypeRows, 8)) {
    audit(adminId, "aid_type.create", "aid_type", a.id as string, a.createdAt as Date, null, {
      name: a.name,
      category: a.category,
    });
  }
  for (const f of sample(familyRows, 40)) {
    audit(
      reviewerFor(f.campId as string),
      "family.create",
      "family",
      f.id as string,
      f.createdAt as Date,
      null,
      { headName: f.headName, memberCount: f.memberCount },
    );
  }
  for (const c of submittedContributions) {
    audit(
      providerUser.get(c.providerId) ?? adminId,
      "contribution.submit",
      "aid_contribution",
      c.id,
      c.at,
      { status: "draft" },
      { status: "submitted" },
    );
  }
  for (const line of sample(confirmedLines, Math.min(35, confirmedLines.length))) {
    audit(
      reviewerFor(line.campId),
      "receipt.status_change",
      "aid_contribution_line",
      line.lineId,
      line.at,
      { status: "pending" },
      { status: line.status },
    );
  }
  for (const c of sample(
    complaintRows.filter((c) => c.status !== "pending"),
    30,
  )) {
    audit(
      c.reviewedById as string,
      "complaint.status_change",
      "complaint",
      c.id as string,
      (c.reviewedAt as Date) ?? (c.createdAt as Date),
      { status: "pending" },
      { status: c.status },
    );
  }
  for (const c of sample(campRows, 8)) {
    audit(
      adminId,
      "need_level.change",
      "camp",
      c.id as string,
      daysAgo(randInt(2, 40)),
      { needLevel: "medium" },
      { needLevel: c.needLevel },
    );
  }
  audit(adminId, "user.deactivate", "user", bannedId, daysAgo(35), { banned: false }, { banned: true });

  auditRows.sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());
  await insertMany("audit log entries", s.auditLog, auditRows);

  /* ---------------------------------------------------------------------- */
  /* 14. Public contact settings                                             */
  /* ---------------------------------------------------------------------- */

  await db.delete(s.contactSettings);
  await db.insert(s.contactSettings).values({
    id: "default",
    whatsapp: "+970599123456",
    email: "info@sa3dne.ps",
    phone: "+97082884400",
    facebook: "https://facebook.com/sa3dne.gaza",
    twitter: "https://x.com/sa3dne_gaza",
    instagram: "https://instagram.com/sa3dne.gaza",
    linkedin: "https://linkedin.com/company/sa3dne",
    address: "غرفة العمليات المشتركة – دير البلح، المحافظة الوسطى، قطاع غزة",
    updatedAt: daysAgo(12),
  });

  /* ---------------------------------------------------------------------- */
  /* Summary                                                                 */
  /* ---------------------------------------------------------------------- */

  const totalIndividuals = familyRows.reduce((acc, f) => acc + (f.memberCount as number), 0);

  console.log("\n🎉 Seed complete.\n");
  console.log("📊 الأرقام:");
  console.log(`   المخيمات / مراكز الإيواء : ${campRows.length}`);
  console.log(`   العائلات                 : ${familyRows.length} (أفراد: ${totalIndividuals})`);
  console.log(`   أفراد العائلات المسجلون  : ${memberRows.length}`);
  console.log(`   المستخدمون               : ${userRows.length + 1} (بما فيهم مدير النظام)`);
  console.log(`   الجهات المانحة           : ${providerRows.length}`);
  console.log(`   أنواع المساعدات          : ${aidTypeRows.length}`);
  console.log(`   المساهمات / البنود       : ${contributionRows.length} / ${lineRows.length}`);
  console.log(`   طلبات الاحتياج / الردود  : ${requestRows.length} / ${responseRows.length}`);
  console.log(`   الشكاوى والمقترحات       : ${complaintRows.length}`);
  console.log(`   طلبات تحديث بيانات عائلة : ${familyRequestRows.length}`);
  console.log(`   الإشعارات                : ${notificationRows.length}`);
  console.log(`   سجل التدقيق              : ${auditRows.length}`);

  console.log("\n🔐 حسابات الدخول:");
  console.log(`   مدير النظام     : ${adminEmail} / ${adminPassword}`);
  for (const m of CAMP_MANAGERS) {
    console.log(`   مدير مخيم       : ${m.email} / ${managerPassword}  (${m.name})`);
  }
  for (const p of PROVIDERS.filter((p) => p.login)) {
    console.log(`   جهة مانحة       : ${p.login!.email} / ${providerPassword}  (${p.name})`);
  }
  console.log("   مستفيدون (تسجيل الدخول برقم الهوية):");
  for (const f of beneficiaryFamilies.slice(0, 5)) {
    console.log(`                     ${f.nationalId}@sa3dne.local / ${beneficiaryPassword}  (${f.headName})`);
  }
  console.log(`   … و ${beneficiaryFamilies.length - 5} حسابات مستفيدين أخرى بنفس كلمة المرور.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
