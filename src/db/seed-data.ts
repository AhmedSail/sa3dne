/**
 * Static reference data for the demo seed (`src/db/seed.ts`).
 *
 * Everything here is written to read like the real Gaza displacement context:
 * governorate-accurate shelter sites, the agencies and grassroots initiatives
 * that actually operate there, and the kinds of household situations and
 * complaints a camp manager sees every day.
 *
 * `capacity` on a camp is expressed in FAMILIES (tents / household slots),
 * because the dashboard computes occupancy as families ÷ capacity.
 */

import type { UserRole } from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* Camps                                                                       */
/* -------------------------------------------------------------------------- */

export type Governorate =
  | "north_gaza"
  | "gaza_city"
  | "middle_area"
  | "khan_yunis"
  | "rafah";

export type SeedCamp = {
  key: string;
  name: string;
  location: Governorate;
  /** Household slots the site can hold. */
  capacity: number;
  /** How many families the seed actually registers there. */
  families: number;
  operationalStatus: "active" | "inactive" | "closed";
  needLevel: "low" | "medium" | "high" | "critical";
  status: "active" | "inactive";
  notes: string;
};

export const CAMPS: SeedCamp[] = [
  {
    key: "beit_lahia_school",
    name: "مركز إيواء مدرسة بيت لاهيا الإعدادية",
    location: "north_gaza",
    capacity: 24,
    families: 22,
    operationalStatus: "active",
    needLevel: "critical",
    status: "active",
    notes:
      "مدرسة حكومية حُوّلت إلى مركز إيواء. الصفوف مقسّمة بأغطية بلاستيكية بين العائلات، ودورات المياه لا تكفي أكثر من ثلث القاطنين.",
  },
  {
    key: "jabalia_nazla",
    name: "مخيم جباليا النزلة للنازحين",
    location: "north_gaza",
    capacity: 32,
    families: 28,
    operationalStatus: "active",
    needLevel: "high",
    status: "active",
    notes:
      "تجمع خيام على أطراف مخيم جباليا. الوصول اللوجستي متقطع بسبب إغلاق الطرق، والتوزيع يتم غالبًا في ساعات الصباح الأولى.",
  },
  {
    key: "beit_hanoun_east",
    name: "تجمع خيام بيت حانون الشرقي",
    location: "north_gaza",
    capacity: 14,
    families: 13,
    operationalStatus: "active",
    needLevel: "critical",
    status: "active",
    notes:
      "أقرب تجمع للحدود الشرقية. لا توجد شبكة مياه، والاعتماد كامل على صهاريج المياه المحلاة مرتين أسبوعيًا.",
  },
  {
    key: "shati_model",
    name: "مخيم الشاطئ النموذجي",
    location: "gaza_city",
    capacity: 30,
    families: 26,
    operationalStatus: "active",
    needLevel: "high",
    status: "active",
    notes:
      "غرب مدينة غزة على الشريط الساحلي. ملوحة المياه الجوفية مرتفعة، والعائلات تعتمد على محطات التحلية الصغيرة.",
  },
  {
    key: "rimal_unrwa_school",
    name: "مركز إيواء مدرسة الرمال الابتدائية (أونروا)",
    location: "gaza_city",
    capacity: 22,
    families: 17,
    operationalStatus: "active",
    needLevel: "medium",
    status: "active",
    notes:
      "مركز تديره الأونروا، الأفضل تجهيزًا في مدينة غزة. توجد نقطة طبية تعمل ست ساعات يوميًا.",
  },
  {
    key: "shujaiya_temp",
    name: "تجمع نازحي الشجاعية المؤقت",
    location: "gaza_city",
    capacity: 16,
    families: 15,
    operationalStatus: "active",
    needLevel: "critical",
    status: "active",
    notes:
      "أنشئ على أرض خالية بعد موجة نزوح مفاجئة. أغلب الخيام مصنوعة من مشمّع ولا تتحمل الشتاء.",
  },
  {
    key: "shifa_yard",
    name: "ساحة إيواء مجمع الشفاء الطبي",
    location: "gaza_city",
    capacity: 12,
    families: 11,
    operationalStatus: "active",
    needLevel: "critical",
    status: "active",
    notes:
      "عائلات تقيم في ساحات المستشفى. الاكتظاظ خانق والمخاطر الصحية مرتفعة، لكن قرب الخدمة الطبية يجعله ملاذًا للحالات المزمنة.",
  },
  {
    key: "deir_balah_west",
    name: "مخيم دير البلح الغربي",
    location: "middle_area",
    capacity: 34,
    families: 25,
    operationalStatus: "active",
    needLevel: "medium",
    status: "active",
    notes:
      "من أكثر المواقع تنظيمًا في المنطقة الوسطى. الممرات مرقّمة والتوزيع يتم حسب أرقام الخيام.",
  },
  {
    key: "nuseirat_new",
    name: "مركز إيواء النصيرات الجديد",
    location: "middle_area",
    capacity: 26,
    families: 22,
    operationalStatus: "active",
    needLevel: "high",
    status: "active",
    notes:
      "استقبل موجة نزوح ثانية من الشمال. الكهرباء تعتمد كليًا على ألواح شمسية تبرعت بها مبادرات محلية.",
  },
  {
    key: "maghazi_east",
    name: "تجمع خيام المغازي الشرقي",
    location: "middle_area",
    capacity: 16,
    families: 11,
    operationalStatus: "active",
    needLevel: "medium",
    status: "active",
    notes:
      "تجمع صغير نسبيًا. المشكلة الأساسية هي الصرف الصحي وتجمع المياه العادمة بين الخيام.",
  },
  {
    key: "zawaida_coastal",
    name: "مخيم الزوايدة الساحلي",
    location: "middle_area",
    capacity: 14,
    families: 8,
    operationalStatus: "active",
    needLevel: "low",
    status: "active",
    notes:
      "الموقع الأقل ضغطًا حاليًا، ويُستخدم لاستقبال العائلات المنقولة من المواقع المكتظة.",
  },
  {
    key: "mawasi_khan_yunis",
    name: "تجمع خيام المواصي – خان يونس",
    location: "khan_yunis",
    capacity: 42,
    families: 37,
    operationalStatus: "active",
    needLevel: "critical",
    status: "active",
    notes:
      "أكبر تجمع في النظام. أرض رملية مكشوفة، والخيام تنهار مع كل منخفض جوي. الاحتياج الأعلى على مستوى القطاع.",
  },
  {
    key: "khan_yunis_secondary",
    name: "مركز إيواء مدرسة خان يونس الثانوية",
    location: "khan_yunis",
    capacity: 22,
    families: 18,
    operationalStatus: "active",
    needLevel: "high",
    status: "active",
    notes:
      "مبنى إسمنتي يوفر حماية جيدة من البرد، لكن الطاقة الاستيعابية تجاوزت التصميم الأصلي بكثير.",
  },
  {
    key: "bani_suheila_east",
    name: "مخيم بني سهيلا الشرقي",
    location: "khan_yunis",
    capacity: 15,
    families: 9,
    operationalStatus: "active",
    needLevel: "medium",
    status: "active",
    notes: "تجمع زراعي سابق. بعض العائلات تزرع مساحات صغيرة لتغطية جزء من احتياجها الغذائي.",
  },
  {
    key: "tal_sultan",
    name: "مخيم تل السلطان الإيوائي",
    location: "rafah",
    capacity: 30,
    families: 27,
    operationalStatus: "active",
    needLevel: "critical",
    status: "active",
    notes:
      "يستقبل النازحين يوميًا من الشمال والوسط. قوائم الانتظار على الخيام تتجاوز عشرات العائلات.",
  },
  {
    key: "mawasi_rafah",
    name: "تجمع نازحي المواصي – رفح",
    location: "rafah",
    capacity: 18,
    families: 15,
    operationalStatus: "active",
    needLevel: "high",
    status: "active",
    notes: "قريب من الشريط الساحلي الجنوبي. صعوبة في إدخال صهاريج المياه بسبب الطرق الرملية.",
  },
  {
    key: "shaboura_closed",
    name: "مركز إيواء الشابورة",
    location: "rafah",
    capacity: 12,
    families: 3,
    operationalStatus: "closed",
    needLevel: "low",
    status: "inactive",
    notes:
      "أُخلي الموقع ونُقلت العائلات إلى تل السلطان والمواصي. يبقى في السجل للأرشفة والتقارير التاريخية.",
  },
];

/* -------------------------------------------------------------------------- */
/* Staff users                                                                 */
/* -------------------------------------------------------------------------- */

export type SeedManager = {
  key: string;
  name: string;
  email: string;
  phone: string;
  /** Camp keys this manager is assigned to. First one is their primary scope. */
  camps: string[];
};

export const CAMP_MANAGERS: SeedManager[] = [
  {
    key: "mgr_north",
    name: "سامي أبو حصيرة",
    email: "manager.north@sa3dne.com",
    phone: "+970599140233",
    camps: ["beit_lahia_school", "jabalia_nazla", "beit_hanoun_east"],
  },
  {
    key: "mgr_gaza",
    name: "ناهد المصري",
    email: "manager.gaza@sa3dne.com",
    phone: "+970599271884",
    camps: ["shati_model", "rimal_unrwa_school", "shujaiya_temp"],
  },
  {
    key: "mgr_gaza_health",
    name: "عبد الله زقوت",
    email: "manager.shifa@sa3dne.com",
    phone: "+970569338417",
    camps: ["shifa_yard"],
  },
  {
    key: "mgr_middle",
    name: "رائد أبو مدين",
    email: "manager.middle@sa3dne.com",
    phone: "+970599452019",
    camps: ["deir_balah_west", "nuseirat_new", "maghazi_east", "zawaida_coastal"],
  },
  {
    key: "mgr_khanyunis",
    name: "إيمان قديح",
    email: "manager.khanyunis@sa3dne.com",
    phone: "+970599563740",
    camps: ["mawasi_khan_yunis", "khan_yunis_secondary", "bani_suheila_east"],
  },
  {
    key: "mgr_rafah",
    name: "محمود الهمص",
    email: "manager.rafah@sa3dne.com",
    phone: "+970568674125",
    camps: ["tal_sultan", "mawasi_rafah", "shaboura_closed"],
  },
];

/* -------------------------------------------------------------------------- */
/* Aid providers                                                               */
/* -------------------------------------------------------------------------- */

export type SeedProvider = {
  key: string;
  type: "organization" | "independent_initiator";
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes: string;
  status: "active" | "inactive";
  /** When set, a login is created for this provider with the given role. */
  login?: { email: string; name: string; role: UserRole };
};

export const PROVIDERS: SeedProvider[] = [
  {
    key: "unrwa",
    type: "organization",
    name: "وكالة الأونروا (UNRWA)",
    contactPerson: "أ. ستيفاني لوران – منسقة شؤون مراكز الإيواء",
    phone: "+97082884400",
    email: "gaza.shelters@unrwa.example",
    notes: "المزود الأكبر للخدمات الأساسية والتعليمية والدعم اللوجستي لمراكز الإيواء.",
    status: "active",
    login: {
      email: "unrwa@sa3dne.com",
      name: "ستيفاني لوران (الأونروا)",
      role: "org_representative",
    },
  },
  {
    key: "wfp",
    type: "organization",
    name: "برنامج الأغذية العالمي (WFP)",
    contactPerson: "أ. كريم الشوا – مسؤول العمليات الغذائية",
    phone: "+97082884511",
    email: "gaza.ops@wfp.example",
    notes: "يوفر الطرود الغذائية الشهرية والدقيق والوجبات الجاهزة عبر شركاء محليين.",
    status: "active",
    login: {
      email: "wfp@sa3dne.com",
      name: "كريم الشوا (برنامج الأغذية العالمي)",
      role: "org_representative",
    },
  },
  {
    key: "prcs",
    type: "organization",
    name: "جمعية الهلال الأحمر الفلسطيني",
    contactPerson: "د. يوسف علي – مدير الخدمات الطبية",
    phone: "+970599110022",
    email: "gaza@prcs.example",
    notes: "الخدمات الطبية الطارئة، النقاط الصحية المتنقلة، وتوزيع الأدوية المزمنة.",
    status: "active",
    login: {
      email: "prcs@sa3dne.com",
      name: "د. يوسف علي (الهلال الأحمر)",
      role: "org_representative",
    },
  },
  {
    key: "unicef",
    type: "organization",
    name: "منظمة اليونيسف (UNICEF)",
    contactPerson: "أ. رنا الفرا – منسقة المياه والإصحاح",
    phone: "+97082884677",
    email: "gaza.wash@unicef.example",
    notes: "مشاريع المياه والإصحاح البيئي، حليب الأطفال، والحقائب المدرسية.",
    status: "active",
    login: {
      email: "unicef@sa3dne.com",
      name: "رنا الفرا (اليونيسف)",
      role: "org_representative",
    },
  },
  {
    key: "who",
    type: "organization",
    name: "منظمة الصحة العالمية (WHO)",
    contactPerson: "د. مالك الأغا – مسؤول الاستجابة الصحية",
    phone: "+97082884733",
    email: "gaza.health@who.example",
    notes: "إمداد النقاط الطبية بالأدوية ومستلزمات الجرحى، ومتابعة الترصد الوبائي.",
    status: "active",
  },
  {
    key: "msf",
    type: "organization",
    name: "أطباء بلا حدود (MSF)",
    contactPerson: "د. لوران بيرو – منسق البعثة",
    phone: "+97082884890",
    email: "gaza@msf.example",
    notes: "عيادات متنقلة ومعالجة الحروق والجراحة التقويمية.",
    status: "active",
  },
  {
    key: "islamic_relief",
    type: "organization",
    name: "الإغاثة الإسلامية عبر العالم",
    contactPerson: "أ. هيثم النجار – مدير البرامج",
    phone: "+970599204488",
    email: "palestine@islamic-relief.example",
    notes: "الطرود الغذائية والكفالات وحملات الشتاء (بطانيات وملابس).",
    status: "active",
  },
  {
    key: "qatar_charity",
    type: "organization",
    name: "قطر الخيرية",
    contactPerson: "أ. عبد العزيز المناعي – ممثل المكتب",
    phone: "+970599337711",
    email: "gaza@qcharity.example",
    notes: "تمويل الخيام العائلية ومشاريع الإيواء المؤقت.",
    status: "active",
  },
  {
    key: "erc",
    type: "organization",
    name: "هيئة الهلال الأحمر الإماراتي",
    contactPerson: "أ. سالم الظاهري – منسق الإغاثة",
    phone: "+970599448820",
    email: "gaza@erc.example",
    notes: "قوافل إغاثية عبر المعابر الجنوبية، تركيز على الغذاء والمياه.",
    status: "active",
  },
  {
    key: "taawon",
    type: "organization",
    name: "مؤسسة التعاون",
    contactPerson: "أ. سهى شراب – منسقة المشاريع",
    phone: "+970599556677",
    email: "gaza@taawon.example",
    notes: "دعم التعليم في الطوارئ والدعم النفسي الاجتماعي للأطفال.",
    status: "active",
  },
  {
    key: "oxfam",
    type: "organization",
    name: "منظمة أوكسفام (Oxfam)",
    contactPerson: "أ. جيمس هاردي – مسؤول البرنامج",
    phone: "+97082884955",
    email: "gaza@oxfam.example",
    notes: "متوقف مؤقتًا عن التوريد لانتهاء دورة التمويل الحالية.",
    status: "inactive",
  },
  {
    key: "takiya",
    type: "independent_initiator",
    name: "مبادرة تكية غزة للتغذية المجتمعية",
    contactPerson: "م. وسيم منصور – منسق المبادرة",
    phone: "+970597112244",
    email: "takiya.gaza@sa3dne.com",
    notes: "مطبخ ميداني تطوعي يوزع وجبات ساخنة يوميًا على مراكز الإيواء القريبة.",
    status: "active",
    login: {
      email: "takiya@sa3dne.com",
      name: "وسيم منصور (تكية غزة)",
      role: "independent_initiator",
    },
  },
  {
    key: "khayma",
    type: "independent_initiator",
    name: "مبادرة «خيمة وحياة» التطوعية",
    contactPerson: "أ. آلاء بربخ – مؤسِّسة المبادرة",
    phone: "+970597338866",
    email: "khayma.life@sa3dne.com",
    notes: "تجمع تبرعات فردية لشراء الخيام والمشمّع وتوزيعها على العائلات حديثة النزوح.",
    status: "active",
    login: {
      email: "khayma@sa3dne.com",
      name: "آلاء بربخ (خيمة وحياة)",
      role: "independent_initiator",
    },
  },
  {
    key: "shabab_nuseirat",
    type: "independent_initiator",
    name: "مبادرة شباب النصيرات لتحلية المياه",
    contactPerson: "م. أنس دلول – متطوع",
    phone: "+970597551199",
    email: "shabab.water@sa3dne.com",
    notes: "تشغيل وحدة تحلية صغيرة بالطاقة الشمسية وتوزيع المياه على الخيام المجاورة.",
    status: "active",
    login: {
      email: "shabab@sa3dne.com",
      name: "أنس دلول (شباب النصيرات)",
      role: "independent_initiator",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Aid types                                                                   */
/* -------------------------------------------------------------------------- */

export type SeedAidType = {
  key: string;
  name: string;
  category: "food" | "medical" | "shelter" | "water" | "other";
  defaultUnit: string;
  status: "active" | "inactive";
  /** Typical quantity range for one camp-level delivery. */
  qty: [number, number];
};

export const AID_TYPES: SeedAidType[] = [
  { key: "food_basket", name: "سلة غذائية شهرية", category: "food", defaultUnit: "سلة", status: "active", qty: [40, 320] },
  { key: "flour", name: "دقيق قمح 25 كغم", category: "food", defaultUnit: "كيس", status: "active", qty: [50, 400] },
  { key: "hot_meals", name: "وجبات ساخنة جاهزة", category: "food", defaultUnit: "وجبة", status: "active", qty: [150, 1200] },
  { key: "canned", name: "معلبات وبقوليات", category: "food", defaultUnit: "كرتونة", status: "active", qty: [30, 250] },
  { key: "baby_milk", name: "حليب أطفال ومكملات غذائية", category: "food", defaultUnit: "علبة", status: "active", qty: [40, 300] },
  { key: "fresh_produce", name: "طرد خضار وفواكه طازجة", category: "food", defaultUnit: "طرد", status: "active", qty: [30, 200] },

  { key: "bottled_water", name: "مياه شرب معبأة", category: "water", defaultUnit: "لتر", status: "active", qty: [2000, 20000] },
  { key: "water_tanker", name: "صهريج مياه للاستهلاك المنزلي", category: "water", defaultUnit: "متر مكعب", status: "active", qty: [10, 90] },
  { key: "water_tank", name: "خزان مياه بلاستيكي 1000 لتر", category: "water", defaultUnit: "خزان", status: "active", qty: [3, 30] },
  { key: "chlorine", name: "مواد تعقيم وكلور", category: "water", defaultUnit: "عبوة", status: "active", qty: [20, 160] },

  { key: "first_aid", name: "حقيبة إسعافات أولية", category: "medical", defaultUnit: "حقيبة", status: "active", qty: [10, 90] },
  { key: "chronic_meds", name: "أدوية الأمراض المزمنة", category: "medical", defaultUnit: "علبة", status: "active", qty: [50, 400] },
  { key: "wound_care", name: "مستلزمات جرحى وضمادات", category: "medical", defaultUnit: "طرد", status: "active", qty: [20, 150] },
  { key: "mobile_clinic", name: "يوم عيادة متنقلة", category: "medical", defaultUnit: "يوم", status: "active", qty: [1, 6] },

  { key: "tent", name: "خيمة عائلية مقاومة للماء", category: "shelter", defaultUnit: "خيمة", status: "active", qty: [5, 60] },
  { key: "blanket", name: "بطانيات شتوية", category: "shelter", defaultUnit: "بطانية", status: "active", qty: [60, 500] },
  { key: "mattress", name: "فرشات إسفنجية", category: "shelter", defaultUnit: "فرشة", status: "active", qty: [40, 350] },
  { key: "winter_clothes", name: "ملابس شتوية للأطفال", category: "shelter", defaultUnit: "طرد", status: "active", qty: [40, 300] },
  { key: "tarpaulin", name: "مشمّع بلاستيكي وعوازل", category: "shelter", defaultUnit: "لفة", status: "active", qty: [10, 120] },

  { key: "hygiene_kit", name: "حقيبة نظافة شخصية", category: "other", defaultUnit: "حقيبة", status: "active", qty: [50, 400] },
  { key: "diapers", name: "حفاضات ومستلزمات أطفال", category: "other", defaultUnit: "طرد", status: "active", qty: [40, 300] },
  { key: "solar_light", name: "ألواح طاقة شمسية وإنارة", category: "other", defaultUnit: "وحدة", status: "active", qty: [5, 50] },
  { key: "cooking_gas", name: "غاز طهي", category: "other", defaultUnit: "أسطوانة", status: "active", qty: [10, 100] },
  { key: "school_kit", name: "حقيبة قرطاسية مدرسية", category: "other", defaultUnit: "حقيبة", status: "active", qty: [30, 250] },
  {
    key: "cash_voucher",
    name: "قسائم شرائية نقدية",
    category: "other",
    defaultUnit: "قسيمة",
    status: "inactive",
    qty: [20, 100],
  },
];

/* -------------------------------------------------------------------------- */
/* Name pools                                                                  */
/* -------------------------------------------------------------------------- */

export const FAMILY_NAMES = [
  "أبو ندى", "الشوا", "الغصين", "السقا", "أبو رمضان", "الترك", "حلس", "صيام",
  "المدهون", "شبير", "قديح", "الفرا", "الأغا", "أبو سلطان", "بركة", "النجار",
  "أبو دقة", "العستل", "زقوت", "مقداد", "الكحلوت", "أبو حصيرة", "دلول",
  "أبو عودة", "الرنتيسي", "حماد", "صبح", "البطش", "أبو جراد", "الزعانين",
  "كحيل", "المصري", "عبد ربه", "الهمص", "زعرب", "أبو طه", "قشطة", "بربخ",
  "أبو عمرة", "الجدي", "شعث", "الأسطل", "النحال", "الصوراني", "أبو شمالة",
  "حسونة", "عاشور", "الطويل", "الشرافي", "أبو لبدة", "البرش", "درويش",
  "أبو معيلق", "السوسي", "مطر", "نصار", "العرعير", "صرصور", "الخالدي",
  "بسيسو", "الوحيدي", "شراب", "برهوم", "أبو ريدة", "الفليت", "أبو مصطفى",
  "المجايدة", "الكرد", "أبو جبل", "نبهان", "الشرفا", "أبو نحل", "سكيك",
] as const;

export const MALE_NAMES = [
  "محمد", "أحمد", "يوسف", "إبراهيم", "خالد", "سامي", "رامي", "عماد", "نضال",
  "سليم", "بلال", "عدنان", "طارق", "عصام", "هاني", "وائل", "مازن", "فادي",
  "أنور", "جهاد", "ماهر", "نبيل", "رائد", "باسم", "أيمن", "زياد", "مروان",
  "حسام", "عاطف", "صابر", "توفيق", "كمال", "جمال", "سمير", "غسان", "عمر",
  "مصطفى", "عبد الرحمن", "أنس", "معتز", "أشرف", "منير", "شادي", "عثمان",
] as const;

export const FEMALE_NAMES = [
  "فاطمة", "مريم", "هدى", "أمل", "سناء", "نور", "رنا", "ليلى", "سميرة",
  "ابتسام", "وفاء", "منى", "إيمان", "سهير", "نجوى", "رشا", "دعاء", "آلاء",
  "ميساء", "أسماء", "صابرين", "هبة", "ريم", "شيماء", "نسرين", "خديجة",
  "زينب", "عائشة", "سعاد", "يسرا", "تسنيم", "لينا", "جميلة", "رغد", "سلمى",
  "بيان", "أروى", "نادية", "حنان", "غادة", "رولا", "بسمة",
] as const;

export const OCCUPATIONS = [
  "معلم مدرسة", "ممرض", "سائق أجرة", "صياد", "مزارع", "عامل بناء",
  "بائع خضار", "خياط", "حداد", "نجار", "كهربائي", "موظف حكومي", "حلاق",
  "ميكانيكي سيارات", "بائع متجول", "صاحب بقالة", "عامل مياومة", "مهندس مدني",
  "صيدلاني", "طبيب أسنان", "عامل نظافة", "حارس أمن", "خباز", "سمكري",
  "مصور صحفي", "محاسب", "بائع ملابس", "عامل في مخبز", "سائق شاحنة",
  "مبرمج", "معقّب معاملات", "عاطل عن العمل", "ربة منزل", "متقاعد",
] as const;

export const FAMILY_NOTES = [
  "نزحت العائلة من بيت حانون بعد تدمير المنزل بالكامل، ولا تملك أي أغراض شخصية.",
  "الأب مصاب بشظايا في الساق ويحتاج متابعة طبية أسبوعية.",
  "أرملة تعيل أطفالها بعد استشهاد الزوج، بحاجة لدعم غذائي منتظم.",
  "أحد الأبناء من ذوي الإعاقة الحركية وبحاجة لكرسي متحرك.",
  "رب الأسرة مريض سكري ويحتاج إنسولين يُحفظ مبردًا.",
  "نزحوا ثلاث مرات من الشمال إلى الجنوب خلال أشهر.",
  "يوجد رضيع أقل من ستة أشهر ويحتاج حليبًا صناعيًا بشكل دائم.",
  "الخيمة تسرّب المطر وتحتاج استبدالًا قبل موسم الشتاء.",
  "العائلة تستضيف أقارب نزحوا حديثًا داخل نفس الخيمة.",
  "الأم حامل في الشهر السابع وتحتاج متابعة في نقطة الرعاية.",
  "جدة مسنة ضمن العائلة تعاني ضغط الدم وتحتاج أدوية مزمنة.",
  "فقد رب الأسرة مصدر رزقه بعد تدمير ورشته.",
  "أطفال العائلة منقطعون عن التعليم منذ بداية النزوح.",
  "يعمل رب الأسرة متطوعًا في تنظيم التوزيع داخل الموقع.",
  "العائلة انتقلت من مركز إيواء مكتظ بناءً على توصية إدارة الموقع.",
  "أحد أفراد العائلة يحتاج جلسات غسيل كلى مرتين أسبوعيًا.",
  "لا يملكون هوية بديلة بعد ضياع الوثائق أثناء النزوح.",
  "تعتمد العائلة كليًا على الوجبات الساخنة الموزعة يوميًا.",
] as const;

export const INACTIVE_FAMILY_REASONS = [
  "انتقلت العائلة إلى مركز إيواء آخر خارج نطاق الموقع.",
  "تم دمج السجل مع سجل عائلة أخرى بعد اكتشاف تكرار.",
  "غادرت العائلة القطاع للعلاج في الخارج.",
  "لم يعد بالإمكان التحقق من إقامة العائلة داخل الموقع.",
] as const;

/* -------------------------------------------------------------------------- */
/* Complaints / suggestions / unmet needs                                      */
/* -------------------------------------------------------------------------- */

export const COMPLAINT_TEXTS: Record<
  "complaint" | "suggestion" | "unmet_need",
  readonly string[]
> = {
  complaint: [
    "لم تصلنا حصة المياه منذ أربعة أيام، والصهريج لا يدخل إلى الجهة الغربية من الموقع.",
    "دورات المياه المشتركة غير صالحة للاستخدام والصرف الصحي يفيض بين الخيام.",
    "التوزيع الأخير لم يشمل الخيام في الصف الأخير رغم تسجيلنا في الكشوفات.",
    "انتشار الحشرات والقوارض داخل التجمع بشكل خطير على الأطفال.",
    "الخيمة تسرّب المطر بالكامل وأغراضنا تبللت في المنخفض الجوي الأخير.",
    "ازدحام شديد أثناء التوزيع أدى إلى مشادات، ولا يوجد تنظيم للطوابير.",
    "انقطاع الإنارة ليلًا في الممرات يجعل التنقل خطرًا خصوصًا للنساء.",
    "الوجبات الساخنة تصل باردة ومتأخرة عن موعدها بأكثر من ثلاث ساعات.",
    "لم يتم تحديث بيانات عائلتي رغم مراجعة الإدارة أكثر من مرة.",
    "نقطة شحن الهواتف الوحيدة معطلة منذ أسبوع ولا نستطيع التواصل مع أقاربنا.",
    "كمية الدقيق الموزعة أقل بكثير من عدد أفراد الأسرة المسجل.",
    "تسرّب مياه عادمة قرب خيام الأطفال وانبعاث روائح كريهة.",
  ],
  suggestion: [
    "نقترح تنظيم التوزيع حسب أرقام الخيام لتفادي الازدحام والمشادات.",
    "تخصيص ساعة توزيع منفصلة للنساء وكبار السن يخفف الضغط كثيرًا.",
    "إنشاء نقطة شحن تعمل بالطاقة الشمسية في وسط الموقع.",
    "إعلان جدول التوزيع الأسبوعي مسبقًا عبر لوحة في مدخل الموقع.",
    "تخصيص خيمة تعليمية للأطفال ولو لثلاث ساعات يوميًا.",
    "توفير حاويات نفايات إضافية وجدولة نقل يومي بدل الأسبوعي.",
    "تدريب متطوعين من داخل الموقع للمساعدة في تنظيم عمليات الاستلام.",
    "تركيب إنارة على الممر الرئيسي يقلل حوادث السقوط ليلًا.",
    "فتح قناة واتساب رسمية للموقع لنشر مواعيد القوافل.",
  ],
  unmet_need: [
    "لا يوجد حليب أطفال للرضع أقل من سنة منذ أسبوعين.",
    "نحتاج أدوية ضغط وسكري لعدد من كبار السن داخل الموقع.",
    "الخيام غير كافية والعائلات الجديدة تنام في العراء.",
    "لا تتوفر ملابس شتوية للأطفال مع انخفاض درجات الحرارة.",
    "نقص حاد في الفرشات والبطانيات مقارنة بعدد القاطنين.",
    "لا توجد نقطة طبية دائمة، وأقرب عيادة تبعد مسافة طويلة سيرًا.",
    "الحفاضات ومستلزمات الأطفال غير متوفرة إطلاقًا هذا الشهر.",
    "غاز الطهي مفقود والعائلات تطبخ على الحطب داخل الخيام.",
    "نحتاج مياه صالحة للشرب بشكل يومي وليس مرتين في الأسبوع.",
    "لا توجد مستلزمات نظافة نسائية ضمن الحقائب الموزعة.",
  ],
};

export const RESOLUTION_NOTES = [
  "تم إدخال صهريج إضافي وتعديل خط سير التوزيع ليشمل الجهة الغربية.",
  "أُصلحت الوحدة الصحية وتم جدولة تنظيف يومي بالتنسيق مع فريق الإصحاح.",
  "تمت إضافة العائلة إلى كشف التوزيع القادم وتعويض الحصة الفائتة.",
  "نُفذت حملة رش ومكافحة حشرات داخل الموقع بالتنسيق مع البلدية.",
  "تم استبدال الخيمة بخيمة جديدة مقاومة للماء ضمن دفعة الإيواء الأخيرة.",
  "اعتُمد نظام التوزيع حسب أرقام الخيام بدءًا من القافلة القادمة.",
  "تم تركيب إنارة شمسية على الممر الرئيسي.",
  "وصلت دفعة حليب أطفال وتم توزيعها على العائلات المسجلة بأطفال رضّع.",
  "تمت إحالة الحالة الطبية إلى العيادة المتنقلة وتزويدها بالأدوية المزمنة.",
] as const;

export const REJECTION_REASONS = [
  "الطلب مكرر، وسبق معالجته ضمن شكوى أخرى بنفس المضمون.",
  "المعلومات غير كافية للتحقق، ولم يمكن الوصول إلى مقدم الشكوى.",
  "الموضوع خارج نطاق صلاحيات إدارة الموقع وأُحيل إلى الجهة المختصة.",
  "تبين بعد المعاينة الميدانية أن الخدمة قُدمت فعليًا في الموعد المحدد.",
] as const;

/* -------------------------------------------------------------------------- */
/* Aid request notes                                                           */
/* -------------------------------------------------------------------------- */

export const REQUEST_NOTES = [
  "الاحتياج عاجل قبل المنخفض الجوي المتوقع نهاية الأسبوع.",
  "الكمية محسوبة على أساس عدد العائلات المسجلة فعليًا في الموقع.",
  "يفضل التسليم في ساعات الصباح الباكر لتفادي الازدحام.",
  "الموقع يستقبل عائلات جديدة يوميًا وقد ترتفع الكمية المطلوبة.",
  "نرجو تنسيق الدخول مسبقًا مع إدارة الموقع لتجهيز نقطة التفريغ.",
  "الاحتياج يغطي أسبوعين فقط، وسيتم رفع طلب جديد بعدها.",
  "أولوية للعائلات التي تضم أطفالًا رضّعًا وكبار سن.",
] as const;

export const RESPONSE_NOTES = [
  "نغطي جزءًا من الكمية ضمن الدفعة القادمة، والباقي حسب توفر المخزون.",
  "الكمية جاهزة في المستودع وسيتم تنسيق النقل خلال 48 ساعة.",
  "نلتزم بالكمية المتفق عليها شريطة تأمين دخول الشاحنة عبر المعبر.",
  "تمت الموافقة على التمويل ونحتاج تأكيد نقطة التسليم.",
  "نساهم بجزء رمزي حسب ما توفر من تبرعات المبادرة هذا الشهر.",
] as const;

export const CONTRIBUTION_NOTES = [
  "قافلة إغاثية ضمن خطة الاستجابة الشهرية.",
  "دفعة طارئة استجابةً لارتفاع مستوى الاحتياج في المواقع الجنوبية.",
  "تبرع مخصص من مانح خارجي لصالح مراكز الإيواء المدرسية.",
  "توزيع ضمن حملة الشتاء.",
  "مساهمة تكميلية بعد تغطية جزئية من شريك آخر.",
  "مسودة قيد التنسيق مع إدارة المواقع، لم تُعتمد الكميات النهائية بعد.",
  "دفعة أسبوعية ثابتة ضمن اتفاقية التشغيل.",
] as const;

export const CONFIRMATION_NOTES = [
  "تم الاستلام والجرد بحضور ممثل عن الجهة المانحة.",
  "استُلمت الكمية كاملة ووُزعت خلال نفس اليوم.",
  "وصلت الشحنة متأخرة عن الموعد لكن الكمية مطابقة.",
  "تم الاستلام مع ملاحظة تلف بسيط في جزء من الكراتين.",
] as const;

export const PARTIAL_NOTES = [
  "وصل جزء من الكمية فقط بسبب تعذر دخول إحدى الشاحنات.",
  "استُلمت كمية أقل من المخطط، وتم الاتفاق على استكمالها لاحقًا.",
  "نقص في الكمية بعد إعادة توجيه جزء منها إلى موقع أعلى احتياجًا.",
] as const;

export const LINE_REJECTION_REASONS = [
  "الكمية غير مطابقة للمواصفات المتفق عليها.",
  "انتهت صلاحية جزء كبير من المواد عند الاستلام.",
  "تعذر التسليم بعد إغلاق الطريق المؤدي إلى الموقع.",
] as const;

export const NOT_RECEIVED_NOTES = [
  "لم تصل الشحنة حتى تاريخه ولم يتم التواصل من الجهة المانحة.",
  "أُلغي دخول القافلة لأسباب أمنية ولم يُحدد موعد بديل.",
] as const;
