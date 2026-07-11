import { loadEnvConfig } from "@next/env";
import { eq, ne } from "drizzle-orm";

// Load env before importing the db module, which reads DATABASE_URL at import time.
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("./index");
  const { user, account, camp, campAssignment, family, familyMember, aidType, aidProvider } = await import("./schema");
  const { hashPassword } = await import("better-auth/crypto");

  console.log("Cleaning existing data to ensure a fresh, full seed...");
  
  // Delete in order to satisfy foreign keys
  await db.delete(familyMember);
  await db.delete(family);
  await db.delete(campAssignment);
  await db.delete(camp);
  await db.delete(aidType);
  await db.delete(aidProvider);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sa3dne.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const adminName = process.env.SEED_ADMIN_NAME ?? "System Admin";

  // Keep admin user but delete other users & credentials accounts
  const existingAdmin = await db
    .select()
    .from(user)
    .where(eq(user.email, adminEmail));

  let adminUserId = "";

  if (existingAdmin.length > 0) {
    adminUserId = existingAdmin[0].id;
    // Delete non-admin accounts and users
    await db.delete(account).where(ne(account.userId, adminUserId));
    await db.delete(user).where(ne(user.id, adminUserId));
    console.log(`ℹ️  Re-using existing Admin user (${adminEmail}).`);
  } else {
    // Delete all accounts and users
    await db.delete(account);
    await db.delete(user);

    const hashedPassword = await hashPassword(adminPassword);
    adminUserId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const now = new Date();

    // Insert admin user
    await db.insert(user).values({
      id: adminUserId,
      name: adminName,
      email: adminEmail,
      emailVerified: true,
      role: "admin",
      banned: false,
      createdAt: now,
      updatedAt: now,
    });

    // Insert admin credential account
    await db.insert(account).values({
      id: accountId,
      accountId: adminUserId,
      providerId: "credential",
      userId: adminUserId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅ Admin user seeded (${adminEmail})`);
  }

  const now = new Date();
  const hashedPassword = await hashPassword("Manager@12345");

  // 1. Seed Camp Managers
  console.log("Seeding camp managers...");
  const manager1Id = crypto.randomUUID();
  const manager2Id = crypto.randomUUID();

  await db.insert(user).values([
    {
      id: manager1Id,
      name: "أبو أحمد (مدير مخيم غزة)",
      email: "manager1@sa3dne.com",
      emailVerified: true,
      role: "camp_manager",
      banned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: manager2Id,
      name: "أميرة عيسى (مديرة مخيم الوسطى والجنوب)",
      email: "manager2@sa3dne.com",
      emailVerified: true,
      role: "camp_manager",
      banned: false,
      createdAt: now,
      updatedAt: now,
    }
  ]);

  await db.insert(account).values([
    {
      id: crypto.randomUUID(),
      accountId: manager1Id,
      providerId: "credential",
      userId: manager1Id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      accountId: manager2Id,
      providerId: "credential",
      userId: manager2Id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    }
  ]);
  console.log("✅ Camp managers seeded.");

  // 2. Seed Camps
  console.log("Seeding camps...");
  const camp1Id = crypto.randomUUID();
  const camp2Id = crypto.randomUUID();
  const camp3Id = crypto.randomUUID();

  await db.insert(camp).values([
    {
      id: camp1Id,
      name: "مخيم الشاطئ النموذجي",
      location: "gaza_city",
      capacity: 150,
      operationalStatus: "active",
      needLevel: "high",
      notes: "يقع غرب مدينة غزة، يعاني من نقص حاد في مياه الشرب.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: camp2Id,
      name: "مخيم دير البلح الغربي",
      location: "middle_area",
      capacity: 200,
      operationalStatus: "active",
      needLevel: "medium",
      notes: "قريب من الساحل، وضع الكهرباء سيء جدًا.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: camp3Id,
      name: "مخيم تل السلطان الإيوائي",
      location: "rafah",
      capacity: 250,
      operationalStatus: "active",
      needLevel: "critical",
      notes: "يعاني من اكتظاظ خانق مع تزايد أعداد النازحين يوميًا.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    }
  ]);
  console.log("✅ Camps seeded.");

  // 3. Seed Camp Assignments
  console.log("Seeding camp assignments...");
  await db.insert(campAssignment).values([
    {
      id: crypto.randomUUID(),
      campId: camp1Id,
      userId: manager1Id,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      campId: camp2Id,
      userId: manager2Id,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      campId: camp3Id,
      userId: manager2Id,
      createdAt: now,
    }
  ]);
  console.log("✅ Camp assignments seeded.");

  // 4. Seed Families & Family Members
  console.log("Seeding families...");
  const f1Id = crypto.randomUUID();
  const f2Id = crypto.randomUUID();
  const f3Id = crypto.randomUUID();
  const f4Id = crypto.randomUUID();
  const f5Id = crypto.randomUUID();

  await db.insert(family).values([
    {
      id: f1Id,
      campId: camp1Id,
      headName: "أحمد محمد الشرفا",
      nationalId: "901234567",
      phone: "+970599123456",
      memberCount: 4,
      occupation: "معلم رياضيات",
      notes: "العائلة نزحت من بيت حانون، بحاجة لحليب أطفال ورعاية طبية.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: f2Id,
      campId: camp1Id,
      headName: "خليل إبراهيم أبو جبل",
      nationalId: "912345678",
      phone: "+970599234567",
      memberCount: 3,
      occupation: "طبيب ممارس عام",
      notes: "يعمل متطوعًا في النقطة الطبية داخل المخيم.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: f3Id,
      campId: camp2Id,
      headName: "محمود يوسف الكرد",
      nationalId: "923456789",
      phone: "+970599345678",
      memberCount: 4,
      occupation: "مهندس مدني",
      notes: "نزح من حي الشجاعية، يساعد في تنظيم الخيام وتخطيط ممرات المخيم.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: f4Id,
      campId: camp2Id,
      headName: "ياسين جميل نبهان",
      nationalId: "934567890",
      phone: "+970599456789",
      memberCount: 5,
      occupation: "مزارع",
      notes: "فقد أرضه الزراعية في شمال قطاع غزة.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: f5Id,
      campId: camp3Id,
      headName: "فارس كمال المدهون",
      nationalId: "945678901",
      phone: "+970599567890",
      memberCount: 2,
      occupation: "خياط ملابس",
      notes: "كبير في السن وزوجته بحاجة لأدوية السكري والضغط.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    }
  ]);

  console.log("Seeding family members...");
  await db.insert(familyMember).values([
    // Family 1 Members (head: أحمد)
    {
      id: crypto.randomUUID(),
      familyId: f1Id,
      name: "ليلى حسن الشرفا",
      relationship: "wife",
      educationLevel: "edu_university",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f1Id,
      name: "خالد أحمد الشرفا",
      relationship: "son",
      educationLevel: "edu_secondary",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f1Id,
      name: "منى أحمد الشرفا",
      relationship: "daughter",
      educationLevel: "edu_elementary",
      createdAt: now,
      updatedAt: now,
    },

    // Family 2 Members (head: خليل)
    {
      id: crypto.randomUUID(),
      familyId: f2Id,
      name: "نورا سمير أبو جبل",
      relationship: "wife",
      educationLevel: "edu_university",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f2Id,
      name: "حسن خليل أبو جبل",
      relationship: "son",
      educationLevel: "edu_preparatory",
      createdAt: now,
      updatedAt: now,
    },

    // Family 3 Members (head: محمود)
    {
      id: crypto.randomUUID(),
      familyId: f3Id,
      name: "فاطمة أحمد الكرد",
      relationship: "wife",
      educationLevel: "edu_university",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f3Id,
      name: "سارة محمود الكرد",
      relationship: "daughter",
      educationLevel: "edu_elementary",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f3Id,
      name: "رنا محمود الكرد",
      relationship: "daughter",
      educationLevel: "edu_none",
      createdAt: now,
      updatedAt: now,
    },

    // Family 4 Members (head: ياسين)
    {
      id: crypto.randomUUID(),
      familyId: f4Id,
      name: "سناء خضر نبهان",
      relationship: "wife",
      educationLevel: "edu_secondary",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f4Id,
      name: "محمد ياسين نبهان",
      relationship: "son",
      educationLevel: "edu_secondary",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f4Id,
      name: "طارق ياسين نبهان",
      relationship: "son",
      educationLevel: "edu_preparatory",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      familyId: f4Id,
      name: "ليان ياسين نبهان",
      relationship: "daughter",
      educationLevel: "edu_elementary",
      createdAt: now,
      updatedAt: now,
    },

    // Family 5 Members (head: فارس)
    {
      id: crypto.randomUUID(),
      familyId: f5Id,
      name: "خديجة عمر المدهون",
      relationship: "wife",
      educationLevel: "edu_preparatory",
      createdAt: now,
      updatedAt: now,
    }
  ]);
  console.log("✅ Families and family members seeded.");

  // 5. Seed Aid Types
  console.log("Seeding aid types...");
  await db.insert(aidType).values([
    {
      id: crypto.randomUUID(),
      name: "سلة غذائية متكاملة",
      category: "food",
      defaultUnit: "سلة عائلية",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "حقيبة طبية وإسعافات أولية",
      category: "medical",
      defaultUnit: "حقيبة",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "خيمة عازلة للمطر والبرد",
      category: "shelter",
      defaultUnit: "خيمة مع المرفقات",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "توزيع مياه صالحة للشرب (صهريج)",
      category: "water",
      defaultUnit: "لتر",
      status: "active",
      createdAt: now,
      updatedAt: now,
    }
  ]);
  console.log("✅ Aid types seeded.");

  // 6. Seed Aid Providers
  console.log("Seeding aid providers...");
  await db.insert(aidProvider).values([
    {
      id: crypto.randomUUID(),
      type: "organization",
      name: "جمعية الهلال الأحمر الفلسطيني",
      contactPerson: "د. يوسف علي - مدير الخدمات الطبية",
      notes: "يقدم المساعدات الطبية والغذائية وتجهيز النطاقات الصحية الطارئة.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "organization",
      name: "وكالة الأونروا (UNRWA)",
      contactPerson: "أ. ستيفاني لوران - منسقة شؤون مخيمات غزة والجنوب",
      notes: "المزود الأكبر للخدمات الأساسية والتعليمية والدعم اللوجستي.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "independent_initiator",
      name: "مبادرة أهل غزة لخير غزة",
      contactPerson: "م. وسيم منصور - متطوع مستقل",
      notes: "مبادرة خيرية تطوعية فردية تهدف لتوزيع الخيام والمياه.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    }
  ]);
  console.log("✅ Aid providers seeded.");

  console.log("🎉 Database cleared and seeded with fresh rich multidata successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
