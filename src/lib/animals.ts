import { donkeyProfiles } from "./donkey-profiles-data";

export interface Animal {
  name: string;
  slug: string;
  age: string;
  sex: string;
  origin: string;
  status: string;
  herd: string;
  pen: string;
  tags: { label: string; color: "green" | "blue" | "amber" | "red" }[];
  traits: string[];
  bestFriends: string[];
  profileImage?: string;
  galleryImages?: string[];
  tagline: string;
  story: string[];
  sponsorable: boolean;
  intakeDate: string;
  adoptedFrom: string;
  behavioralNotes: string;
  medicalRecords: {
    title: string;
    type: string;
    date: string;
    description: string;
    urgent: boolean;
  }[];
  tasks: { title: string; interval: string; type: string }[];
  // ── Adoption / identity fields (from donkey-adoption.csv) ──
  birthDate?: string | null;
  color?: string;
  size?: string; // "Mini" | "Standard" | "Mammoth"
  microchip?: string | null;
  needsChip?: boolean;
  // Adoption status flags
  momBabyCount?: number;
  isBondedPair?: boolean;
  isSpecialNeedsFlag?: boolean;
  isOver20?: boolean;
  // Family relationships extracted from notes
  parents?: string[];
  children?: string[];
  bondedWith?: string[];
  // Additional medical
  lastAnnualExam?: string | null;
  // Scheduled care dates (set by Joshy's set_hoof_date / set_dental_date,
  // or via the Hoof/Dental dashboard). Optional because the in-memory seed
  // data doesn't include these — they're fetched live from /api/hoof-visits
  // and /api/dental-visits and surfaced where needed.
  nextHoofDue?: string | null;
  nextDentalDue?: string | null;
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Pen assignments by herd
const herdPens: Record<string, string> = {
  "Elsie's Herd": "Enclosure 1 — North Pasture",
  Brave: "Enclosure 2 — East Meadow",
  Unicorns: "Enclosure 3 — West Field",
  Pegasus: "Enclosure 4 — South Pasture",
  Seniors: "Enclosure 5 — Shady Oaks",
  "Pinky's Herd": "Enclosure 6 — Founder's Pasture",
  Dragons: "Enclosure 7 — Canyon View",
  Angels: "Enclosure 8 — Hilltop",
  Legacy: "Enclosure 9 — Homestead",
};

// Rotating dummy sexes
const sexes = ["Jenny", "Jack", "Gelding"];

// Rotating dummy ages
const ages = [
  "2 yr old",
  "3 yr old",
  "4 yr old",
  "5 yr old",
  "6 yr old",
  "7 yr old",
  "8 yr old",
  "10 yr old",
  "12 yr old",
  "15 yr old",
];

// Rotating origins
const origins = [
  "Wild — Death Valley, CA",
  "Wild — Arizona",
  "Domestic",
  "Rescue — Neglect Case",
  "Wild — Nevada",
  "Rescue — Abandoned",
  "Hoarding Rescue",
  "Wild — Utah",
  "Owner Surrender",
  "BLM Roundup",
];

// Intake dates pool
const intakeDates = [
  "Sep 2021",
  "Mar 2022",
  "Jun 2022",
  "Nov 2022",
  "Feb 2023",
  "May 2023",
  "Aug 2023",
  "Jan 2024",
  "Apr 2024",
  "Jul 2024",
  "Oct 2024",
  "Dec 2024",
  "Feb 2025",
];

// Task templates
function tasksForAnimal(
  name: string,
  herd: string,
  status: string,
  i: number
): Animal["tasks"] {
  const base: Animal["tasks"] = [
    { title: `Morning feed — ${name}`, interval: "Daily", type: "Donkey-specific" },
    {
      title: "Check water trough",
      interval: "Daily",
      type: "Global",
    },
  ];

  if (status === "Special Needs") {
    base.push({
      title: `Leg bandage check — ${name}`,
      interval: "Daily",
      type: "Donkey-specific",
    });
    base.push({
      title: `Administer medication — ${name}`,
      interval: "Daily",
      type: "Donkey-specific",
    });
  }

  if (i % 3 === 0) {
    base.push({
      title: `Enrichment session — ${name}`,
      interval: "Daily",
      type: "Donkey-specific",
    });
  }

  base.push({
    title: `Evening feed — ${name}`,
    interval: "Daily",
    type: "Donkey-specific",
  });

  if (i % 2 === 0) {
    base.push({ title: "Brushing & grooming", interval: "Weekly", type: "Donkey-specific" });
  }

  base.push({ title: "Hoof check", interval: "Monthly", type: "Donkey-specific" });

  return base;
}

// Medical record templates
// Real medical records come from three places:
//   - DB-backed MedicalEntry rows (useMedical().entries)
//   - CSV-imported entries (annual exams, yard-wide dewormings)
//   - Joshy log_* actions (temperatures, fecal tests, provider visits, etc.)
//
// Per a request from the dev team, the synthetic placeholder stubs that used
// to live here (Hoof Trim Feb 15, Deworming Jan 20, Wellness Exam Dec 10,
// Dental Float Nov 5, and a Temperature Check that fired for every 7th donkey)
// were removed. They were appearing on every donkey's profile with the same
// dates and were misleading staff. We now return an empty seed list.
function medicalForAnimal(
  _name: string,
  _status: string,
  _i: number
): Animal["medicalRecords"] {
  return [];
}

// Upcoming medical events (for dashboard)
export const upcomingMedical = [
  { date: "APR 1", name: "Shelley", description: "Leg Bandage Change", urgent: true },
  { date: "APR 3", name: "Gabriel", description: "Prosthetic Fitting Check", urgent: true },
  { date: "APR 5", name: "Pete", description: "Hoof Trim (overdue)", urgent: true },
  { date: "APR 8", name: "Winnie", description: "Vet Check — Legs", urgent: true },
  { date: "APR 10", name: "Cassidy", description: "Corrective Hoof Trim", urgent: false },
  { date: "APR 12", name: "Edgar", description: "Senior Wellness Check", urgent: false },
  { date: "APR 15", name: "Blossom", description: "Dental Float", urgent: false },
  { date: "APR 18", name: "Leilani", description: "Deworming", urgent: false },
  { date: "APR 22", name: "Pink", description: "Hoof Trim", urgent: false },
  { date: "APR 25", name: "Luna", description: "Hoof Trim", urgent: false },
  { date: "APR 28", name: "Rosie", description: "Vaccination Booster", urgent: false },
  { date: "MAY 1", name: "Winky", description: "Hoof Trim", urgent: false },
];

// Fields owned by the adoption CSV. If a makeDonkey() call passes any of these
// in `overrides`, they are silently dropped — the CSV is the source of truth.
const CSV_OWNED_KEYS = new Set<keyof Animal>([
  "age",
  "sex",
  "origin",
  "intakeDate",
  "birthDate",
  "color",
  "size",
  "microchip",
  "needsChip",
  "momBabyCount",
  "isBondedPair",
  "isSpecialNeedsFlag",
  "isOver20",
  "parents",
  "children",
  "bondedWith",
  "lastAnnualExam",
]);

function makeDonkey(
  name: string,
  herd: string,
  i: number,
  overrides: Partial<Animal> = {}
): Animal {
  const status = overrides.status ?? "Active";
  // Look up real adoption-CSV data for this donkey (if present)
  const profile = donkeyProfiles.get(name);

  // Strip CSV-owned fields from overrides — they cannot be hand-overridden.
  // Curated fields (traits, tagline, story, tags, profileImage, etc.) still win.
  const safeOverrides: Partial<Animal> = {};
  for (const k of Object.keys(overrides) as Array<keyof Animal>) {
    if (!CSV_OWNED_KEYS.has(k)) {
      (safeOverrides as Record<string, unknown>)[k] = overrides[k];
    }
  }

  const base: Animal = {
    name,
    slug: slug(name),
    age: profile?.age ?? ages[i % ages.length],
    sex: profile?.sex ?? sexes[i % sexes.length],
    origin: profile?.origin ?? origins[i % origins.length],
    status,
    herd: profile?.herd ?? herd,
    pen: herdPens[profile?.herd ?? herd] ?? "",
    tags: [{ label: "Healthy", color: "green" }],
    traits: [],
    bestFriends: profile?.bondedWith ?? [],
    tagline: "",
    story: [],
    sponsorable: false,
    intakeDate: profile?.intakeDate ?? intakeDates[i % intakeDates.length],
    adoptedFrom: profile?.adoptedFrom ?? "",
    // Behavioral notes are intentionally empty until staff fills them in via
    // the app — no dummy data, no auto-fill from medical/special-needs columns.
    behavioralNotes: "",
    medicalRecords: medicalForAnimal(name, status, i),
    tasks: tasksForAnimal(name, herd, status, i),
    // ── Adoption / identity fields ──
    birthDate: profile?.birthDate ?? null,
    color: profile?.color,
    size: profile?.size,
    microchip: profile?.microchip,
    needsChip: profile?.needsChip ?? false,
    momBabyCount: profile?.momBabyCount ?? 0,
    isBondedPair: profile?.isBondedPair ?? false,
    isSpecialNeedsFlag: profile?.isSpecialNeeds ?? false,
    isOver20: profile?.isOver20 ?? false,
    parents: profile?.parents ?? [],
    children: profile?.children ?? [],
    bondedWith: profile?.bondedWith ?? [],
    lastAnnualExam: profile?.lastAnnualExam ?? null,
    ...safeOverrides,
  };

  // Union of hand-coded bestFriends with parser-extracted bondedWith from the
  // adoption Notes column. Previously hand-coded overrides won outright, which
  // left donkeys like Eli (hand-coded ["Pink"]) missing their full bond list
  // ("Pink, Rizzo, Sandy" per the spreadsheet). Self-references are dropped.
  const handCoded = safeOverrides.bestFriends ?? base.bestFriends;
  const fromSheet = profile?.bondedWith ?? [];
  const union: string[] = [];
  const seen = new Set<string>();
  for (const friend of [...handCoded, ...fromSheet]) {
    if (friend === name) continue;
    const key = friend.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    union.push(friend);
  }
  base.bestFriends = union;
  return base;
}

// Alphabetized per the dev team's request. This array drives the herd
// filter tabs on the Animals page and the herd grouping on the dashboard.
export const herds = [
  "Angels",
  "Brave",
  "Dragons",
  "Elsie's Herd",
  "Legacy",
  "Pegasus",
  "Pinky's Herd",
  "Seniors",
  "Unicorns",
] as const;

export type HerdName = (typeof herds)[number];

export const herdCounts: Record<HerdName, number> = {
  "Elsie's Herd": 24,
  Brave: 17,
  Unicorns: 10,
  Pegasus: 11,
  Seniors: 9,
  "Pinky's Herd": 13,
  Dragons: 8,
  Angels: 7,
  Legacy: 4,
};

let idx = 0;

// Raw array — declaration order matches how the herds were authored
// historically. The public `animals` export below sorts within each herd
// alphabetically by name (per the dev team's request) so list views and
// dropdowns are easier to scan. Sorting is stable; cross-herd order is
// preserved by `herds` (the canonical herd order array).
const _animalsRaw: Animal[] = [
  // ── Elsie's Herd (22) ──
  makeDonkey("Elsie", "Elsie's Herd", idx++, { sex: "Jenny", age: "10 yr old", origin: "Wild — Death Valley, CA", bestFriends: ["Fred", "Buster"], tagline: "The matriarch of her herd" }),
  makeDonkey("Fred", "Elsie's Herd", idx++, { sex: "Gelding", age: "9 yr old", bestFriends: ["Elsie"] }),
  makeDonkey("Berkley", "Elsie's Herd", idx++, { sex: "Jack", age: "6 yr old" }),
  makeDonkey("Buster", "Elsie's Herd", idx++, { sex: "Gelding", age: "12 yr old", bestFriends: ["Elsie", "Fernie"] }),
  makeDonkey("Nakoa", "Elsie's Herd", idx++, { sex: "Jack", age: "5 yr old" }),
  makeDonkey("Herman", "Elsie's Herd", idx++, { sex: "Gelding", age: "14 yr old" }),
  makeDonkey("Nelly Belle", "Elsie's Herd", idx++, { sex: "Jenny", age: "8 yr old" }),
  makeDonkey("Athena", "Elsie's Herd", idx++, { sex: "Jenny", age: "7 yr old" }),
  makeDonkey("Portia", "Elsie's Herd", idx++, { sex: "Jenny", age: "6 yr old" }),
  makeDonkey("Elizabeth", "Elsie's Herd", idx++, { sex: "Jenny", age: "11 yr old" }),
  makeDonkey("Ashley", "Elsie's Herd", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("Princess", "Elsie's Herd", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Bo", "Elsie's Herd", idx++, { sex: "Jack", age: "7 yr old" }),
  makeDonkey("Pepper", "Elsie's Herd", idx++, {
    sex: "Jenny",
    age: "6 yr old",
    origin: "Rescue — Neglect Case",
    bestFriends: ["Dusty", "Clover"],
    tagline: "First one to the feed bucket",
    story: [
      "Pepper was rescued from a neglect case — underweight, scared, and unsure of people. It didn't take long for her true personality to come roaring out. Now she's the first one to the feed bucket, every single time.",
      "She has a big personality packed into a small frame. She'll nudge you until you pay attention, and she's never met a carrot she didn't like.",
    ],
  }),
  makeDonkey("Bella", "Elsie's Herd", idx++, { sex: "Jenny", age: "8 yr old" }),
  makeDonkey("Bob", "Elsie's Herd", idx++, { sex: "Gelding", age: "13 yr old" }),
  makeDonkey("Sophie", "Elsie's Herd", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("J-Donk", "Elsie's Herd", idx++, { sex: "Jack", age: "9 yr old" }),
  makeDonkey("Will", "Elsie's Herd", idx++, { sex: "Gelding", age: "10 yr old" }),
  makeDonkey("Moses", "Elsie's Herd", idx++, { sex: "Jack", age: "11 yr old" }),
  makeDonkey("Peter", "Elsie's Herd", idx++, { sex: "Gelding", age: "15 yr old", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Wendy", "Elsie's Herd", idx++, { sex: "Jenny", age: "7 yr old" }),
  makeDonkey("Jethro", "Elsie's Herd", idx++, { sex: "Jack", age: "1 yr old", tagline: "Sophie's surrogate baby" }),
  makeDonkey("Jemma", "Elsie's Herd", idx++, { sex: "Jenny", age: "1 yr old", tagline: "Sophie's surrogate baby" }),

  // ── Brave (17) ──
  makeDonkey("Leilani", "Brave", idx++, { sex: "Jenny", age: "6 yr old", bestFriends: ["Ophelia"] }),
  makeDonkey("Ophelia", "Brave", idx++, { sex: "Jenny", age: "5 yr old", bestFriends: ["Leilani"] }),
  makeDonkey("Star", "Brave", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Elanora", "Brave", idx++, { sex: "Jenny", age: "7 yr old" }),
  makeDonkey("Asher", "Brave", idx++, { sex: "Jack", age: "5 yr old", bestFriends: ["Gabriel", "Halo"], tagline: "Gabriel's mentor in the Brave Herd" }),
  makeDonkey("Angel", "Brave", idx++, { sex: "Jenny", age: "8 yr old" }),
  makeDonkey("Seraphina", "Brave", idx++, { sex: "Jenny", age: "6 yr old" }),
  makeDonkey("Celeste", "Brave", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("Dawn", "Brave", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Dusk", "Brave", idx++, { sex: "Jack", age: "7 yr old" }),
  makeDonkey("Gracie", "Brave", idx++, { sex: "Jenny", age: "6 yr old" }),
  makeDonkey("Skyla (Skye)", "Brave", idx++, { sex: "Jenny", age: "3 yr old" }),
  makeDonkey("Gabriel", "Brave", idx++, {
    sex: "Jack",
    age: "2 yr old",
    origin: "Wild — found by rancher",
    status: "Special Needs",
    tagline: "The miracle with a magic leg",
    bestFriends: ["Asher", "Halo"],
    tags: [
      { label: "Special Needs", color: "red" },
      { label: "Sponsor Available", color: "blue" },
    ],
    sponsorable: true,
    story: [
      "Gabriel is the most recent donkey to join our Donkey Dreams family. As a baby in the wild, Gabriel survived alone with part of his back leg missing.",
      "After over 75 daily bandage changes and a major growth spurt, Gabriel's first test run with his prosthetic was nothing short of miraculous.",
    ],
  }),
  makeDonkey("Merida", "Brave", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("Danny Boy", "Brave", idx++, { sex: "Gelding", age: "9 yr old" }),
  makeDonkey("Finn", "Brave", idx++, { sex: "Jack", age: "4 yr old" }),
  makeDonkey("Halo", "Brave", idx++, { sex: "Jenny", age: "3 yr old", bestFriends: ["Gabriel", "Asher"], tagline: "Gabriel's primary playmate" }),

  // ── Unicorns (10) ──
  makeDonkey("Luna", "Unicorns", idx++, { sex: "Jenny", age: "6 yr old", bestFriends: ["Rainier"] }),
  makeDonkey("Rainier", "Unicorns", idx++, { sex: "Jack", age: "8 yr old", bestFriends: ["Luna"] }),
  makeDonkey("Xander", "Unicorns", idx++, { sex: "Jack", age: "5 yr old" }),
  makeDonkey("Makuahine Hau", "Unicorns", idx++, { sex: "Gelding", age: "10 yr old" }),
  makeDonkey("Olaf", "Unicorns", idx++, { sex: "Gelding", age: "7 yr old" }),
  makeDonkey("Summer", "Unicorns", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Oscar", "Unicorns", idx++, { sex: "Gelding", age: "9 yr old" }),
  makeDonkey("Solstice", "Unicorns", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("Cinder", "Unicorns", idx++, { sex: "Jenny", age: "6 yr old" }),
  makeDonkey("Ella", "Unicorns", idx++, { sex: "Jenny", age: "3 yr old" }),

  // ── Pegasus (11) ──
  makeDonkey("Rosie", "Pegasus", idx++, { sex: "Jenny", age: "7 yr old", bestFriends: ["Enzo"] }),
  makeDonkey("Enzo", "Pegasus", idx++, { sex: "Jack", age: "6 yr old", bestFriends: ["Rosie"] }),
  makeDonkey("Farrah", "Pegasus", idx++, { sex: "Jenny", age: "8 yr old" }),
  makeDonkey("Huck", "Pegasus", idx++, { sex: "Gelding", age: "5 yr old" }),
  makeDonkey("Leialoha", "Pegasus", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Izabella (Izzy)", "Pegasus", idx++, { sex: "Jenny", age: "6 yr old" }),
  makeDonkey("Teo", "Pegasus", idx++, { sex: "Jack", age: "5 yr old" }),
  makeDonkey("Stella", "Pegasus", idx++, { sex: "Jenny", age: "7 yr old" }),
  makeDonkey("Everest", "Pegasus", idx++, { sex: "Jack", age: "9 yr old" }),
  makeDonkey("Kai-Ya", "Pegasus", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Kai", "Pegasus", idx++, { sex: "Jack", age: "3 yr old" }),

  // ── Seniors (8) ──
  makeDonkey("Edgar", "Seniors", idx++, {
    age: "25 yr old", sex: "Jack", origin: "Wild",
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }, { label: "Senior Care", color: "amber" }],
    sponsorable: true, tagline: "The distinguished elder",
  }),
  makeDonkey("Winky", "Seniors", idx++, {
    age: "12 yr old", sex: "Jack", origin: "Wild",
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }, { label: "Senior Care", color: "amber" }],
    sponsorable: true, tagline: "One-eyed wonder",
  }),
  makeDonkey("Swayze", "Seniors", idx++, { age: "20 yr old", sex: "Gelding", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Tenzel", "Seniors", idx++, { age: "22 yr old", sex: "Gelding", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Blossom", "Seniors", idx++, { age: "18 yr old", sex: "Jenny", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Churro", "Seniors", idx++, { age: "19 yr old", sex: "Gelding", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Jasper", "Seniors", idx++, { age: "21 yr old", sex: "Jack", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Rodney", "Seniors", idx++, { age: "17 yr old", sex: "Gelding", tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Mrs. Truman", "Seniors", idx++, {
    age: "Senior", sex: "Jenny",
    tags: [{ label: "Senior Care", color: "amber" }],
    tagline: "Surrendered to PVDR with Nelly Belle",
  }),

  // ── Pinky's Herd (12) ──
  makeDonkey("Pink", "Pinky's Herd", idx++, {
    age: "4 yr old", sex: "Jenny", origin: "Wild — Death Valley, CA",
    tagline: "The Donkey Dreams Ambassador",
    profileImage: "/donkeys/pink/profile.jpeg",
    galleryImages: ["/donkeys/pink/%231.jpg", "/donkeys/pink/%232.jpg", "/donkeys/pink/%233.jpeg"],
    bestFriends: ["Eli"],
    story: [
      "On Saturday, September 11, 2021 Donkey Dreams Sanctuary Founders, Amber and Edj, lives changed forever when Pink was born.",
      "Pink had a rough start to life. When she was born, her mom wasn't interested in being a mom so Amber had to bottle feed her.",
      "Despite Pink's early health challenges, she is now incredibly healthy. She lives with her best friend Eli, her two four legged moms and her two legged mom, Amber.",
    ],
    intakeDate: "Sep 2021",
  }),
  makeDonkey("Sandy", "Pinky's Herd", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild — Death Valley, CA",
    tagline: "Pink's mom, Death Valley original",
    profileImage: "/donkeys/sandy/profile-photo.jpg",
    bestFriends: ["Pink", "Rizzo"],
    intakeDate: "Sep 2021",
  }),
  makeDonkey("Eli", "Pinky's Herd", idx++, {
    age: "4 yr old", sex: "Jack", origin: "Wild — Death Valley, CA",
    tagline: "Regal, reserved, and Pink's ride-or-die",
    profileImage: "/donkeys/eli/profile-photo.jpg",
    galleryImages: ["/donkeys/eli/%231.png", "/donkeys/eli/%232.png", "/donkeys/eli/%233.png"],
    bestFriends: ["Pink"],
    intakeDate: "Sep 2021",
  }),
  makeDonkey("Rizzo", "Pinky's Herd", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild — Death Valley, CA",
    tagline: "Eli's mom, Pink's second mom",
    profileImage: "/donkeys/rizzo/profile-photo.jpg",
    bestFriends: ["Eli", "Sandy"],
    intakeDate: "Sep 2021",
  }),
  makeDonkey("Pete", "Pinky's Herd", idx++, {
    age: "28 yr old", sex: "Gelding", origin: "Domestic",
    tagline: "28 years old and living his best life",
    profileImage: "/donkeys/pete/profile-photo.jpg",
    galleryImages: ["/donkeys/pete/%231.jpg", "/donkeys/pete/%232.png", "/donkeys/pete/%233.jpg"],
    bestFriends: ["Lila"],
    tags: [{ label: "Sponsor Available", color: "blue" }, { label: "Senior Care", color: "amber" }],
    sponsorable: true,
  }),
  makeDonkey("Lila", "Pinky's Herd", idx++, {
    age: "3 yr old", sex: "Jenny", origin: "Wild — Death Valley, CA",
    tagline: "Pete's girlfriend, big sis to the herd",
    profileImage: "/donkeys/lila/profile-photo.jpg",
    bestFriends: ["Pete", "Pink"],
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
  }),
  makeDonkey("Lava", "Pinky's Herd", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("Obsidian", "Pinky's Herd", idx++, { sex: "Jack", age: "6 yr old" }),
  makeDonkey("Vanellope", "Pinky's Herd", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Ralphie", "Pinky's Herd", idx++, { sex: "Gelding", age: "8 yr old" }),
  makeDonkey("Peggy", "Pinky's Herd", idx++, { sex: "Jenny", age: "7 yr old" }),
  makeDonkey("Cassidy", "Pinky's Herd", idx++, {
    age: "9 yr old", sex: "Gelding", origin: "Hoarding Rescue",
    status: "Special Needs",
    tagline: "Corrective hoof care warrior",
    tags: [{ label: "Special Needs", color: "red" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
  }),
  makeDonkey("Cora", "Pinky's Herd", idx++, {
    sex: "Jenny", age: "10 yr old", origin: "Saline Valley, CA",
    tagline: "Returned from previous adoption",
  }),

  // ── Dragons (8) ──
  makeDonkey("Aurora", "Dragons", idx++, { sex: "Jenny", age: "5 yr old", bestFriends: ["Jett"] }),
  makeDonkey("Jett", "Dragons", idx++, { sex: "Jack", age: "6 yr old", bestFriends: ["Aurora"] }),
  makeDonkey("Raya", "Dragons", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Draco", "Dragons", idx++, { sex: "Jack", age: "7 yr old" }),
  makeDonkey("Reiki", "Dragons", idx++, { sex: "Jenny", age: "5 yr old" }),
  makeDonkey("Remi", "Dragons", idx++, { sex: "Gelding", age: "6 yr old" }),
  makeDonkey("Cloud", "Dragons", idx++, { sex: "Jenny", age: "3 yr old" }),
  makeDonkey("Sky", "Dragons", idx++, { sex: "Jack", age: "4 yr old" }),

  // ── Angels (7) ──
  makeDonkey("Jack Jack", "Angels", idx++, { sex: "Jack", age: "5 yr old", bestFriends: ["Arya"] }),
  makeDonkey("Arya", "Angels", idx++, { sex: "Jenny", age: "6 yr old", bestFriends: ["Jack Jack", "Saphira"] }),
  makeDonkey("Saphira", "Angels", idx++, { sex: "Jenny", age: "7 yr old", bestFriends: ["Arya"] }),
  makeDonkey("Oliver", "Angels", idx++, { sex: "Gelding", age: "8 yr old", bestFriends: ["Olivia"] }),
  makeDonkey("Olivia", "Angels", idx++, { sex: "Jenny", age: "7 yr old", bestFriends: ["Oliver"] }),
  makeDonkey("Zara", "Angels", idx++, { sex: "Jenny", age: "4 yr old" }),
  makeDonkey("Amira", "Angels", idx++, { sex: "Jenny", age: "5 yr old" }),

  // ── Legacy (4) ──
  makeDonkey("Gemma", "Legacy", idx++, { sex: "Jenny", age: "10 yr old", tagline: "A legacy of love" }),
  makeDonkey("Winnie", "Legacy", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild",
    status: "Special Needs",
    tagline: "Don't judge this book by its cover",
    profileImage: "/donkeys/winnie/profile-photo.jpg",
    galleryImages: ["/donkeys/winnie/%231.jpg", "/donkeys/winnie/%232.jpg", "/donkeys/winnie/%233.jpg"],
    bestFriends: ["Shelley", "Jema"],
    tags: [{ label: "Special Needs", color: "red" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
  }),
  makeDonkey("Shelley", "Legacy", idx++, {
    age: "18 yr old", sex: "Jenny", origin: "Wild",
    status: "Special Needs",
    tagline: "The strongest mama in the herd",
    profileImage: "/donkeys/shelley/profile-photo.jpg",
    galleryImages: ["/donkeys/shelley/%231.jpg", "/donkeys/shelley/%232.jpeg", "/donkeys/shelley/%233.jpg"],
    bestFriends: ["Jethro", "Amber"],
    tags: [{ label: "Special Needs", color: "red" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
  }),
  makeDonkey("Fernie", "Legacy", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild — Antelope Preserve",
    tagline: "She waited a long time — but she made it",
    profileImage: "/donkeys/fernie/profile-photo.jpg",
    galleryImages: ["/donkeys/fernie/%231.jpg", "/donkeys/fernie/%232.jpg", "/donkeys/fernie/%233.jpg"],
    bestFriends: ["Elsie", "Buster"],
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
  }),
];

// Public export — alphabetized within each herd, preserving the cross-herd
// order defined by `herds`. Animals whose herd isn't in the canonical list
// (defensive — shouldn't happen) come last in their original order.
export const animals: Animal[] = (() => {
  const herdOrder = new Map<string, number>(
    herds.map((h, i) => [h, i] as const)
  );
  return [..._animalsRaw].sort((a, b) => {
    const ha = herdOrder.get(a.herd) ?? Number.MAX_SAFE_INTEGER;
    const hb = herdOrder.get(b.herd) ?? Number.MAX_SAFE_INTEGER;
    if (ha !== hb) return ha - hb;
    return a.name.localeCompare(b.name);
  });
})();

export function getAnimalBySlug(s: string): Animal | undefined {
  return animals.find((a) => a.slug === s);
}

export function getAnimalsByHerd(herd: string): Animal[] {
  return animals.filter((a) => a.herd === herd);
}

// Dashboard helpers
export function getSpecialNeedsAnimals(): Animal[] {
  return animals.filter((a) => a.status === "Special Needs");
}

export function getSeniorAnimals(): Animal[] {
  return animals.filter((a) => a.tags.some((t) => t.label === "Senior Care"));
}

export function getCareAlerts(): number {
  return animals.filter(
    (a) => a.medicalRecords.some((r) => r.urgent)
  ).length;
}

export function getTodayTaskStats(): { completed: number; total: number } {
  const total = animals.reduce((sum, a) => sum + a.tasks.length, 0);
  // Simulate ~40% completion
  return { completed: Math.round(total * 0.42), total };
}
