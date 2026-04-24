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
  "Elsie's Herd": "Pen 1 — North Pasture",
  Brave: "Pen 2 — East Meadow",
  Unicorns: "Pen 3 — West Field",
  Pegasus: "Pen 4 — South Pasture",
  Seniors: "Pen 5 — Shady Oaks",
  "Pinky's Herd": "Pen 6 — Founder's Pasture",
  Dragons: "Pen 7 — Canyon View",
  Angels: "Pen 8 — Hilltop",
  Legacy: "Pen 9 — Homestead",
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

// Behavioral notes pool
const behaviorPool = [
  "Loves ears scratched. Approaches humans willingly. Calm during hoof care.",
  "Scared of side-by-sides and loud engines. Needs slow introductions to new people.",
  "Very food-motivated — will follow anyone with treats. Gentle with children.",
  "Shy at first but warms up quickly. Enjoys brushing sessions. Dislikes being separated from herd.",
  "Confident and curious. Will investigate anything new. Good with halter work.",
  "Nervous around sudden movements. Responds well to soft voice. Loves chin scratches.",
  "Very social — greets visitors at the fence. Occasionally pushes boundaries with other donkeys.",
  "Independent spirit. Prefers to approach on own terms. Excellent with vet visits.",
  "Playful and energetic. Loves toys and enrichment items. Can be mouthy — redirect with treats.",
  "Calm and steady. Good influence on nervous new arrivals. Enjoys massage sessions.",
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

// Adopted from pool
const adoptedFromPool = [
  "BLM Holding Facility, Ridgecrest CA",
  "Private owner surrender, Flagstaff AZ",
  "County animal control, Kingman AZ",
  "Wild — captured by rancher",
  "Rescue partner organization",
  "Humane society transfer",
  "Hoarding situation, Phoenix AZ",
  "Abandoned property, Sedona AZ",
  "Death Valley rescue operation",
  "Nevada wild horse & burro program",
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
function medicalForAnimal(
  name: string,
  status: string,
  i: number
): Animal["medicalRecords"] {
  const records: Animal["medicalRecords"] = [];

  records.push({
    title: "Hoof Trim",
    type: "Hoof & Dental",
    date: "Feb 15, 2026",
    description: "Routine hoof trim. All four hooves in good condition.",
    urgent: false,
  });

  if (i % 3 === 0) {
    records.push({
      title: "Deworming",
      type: "Medication",
      date: "Jan 20, 2026",
      description: "Routine deworming administered. No adverse reaction.",
      urgent: false,
    });
  }

  if (i % 4 === 0) {
    records.push({
      title: "Annual Wellness Exam",
      type: "Vet Visit",
      date: "Dec 10, 2025",
      description:
        "Full physical exam. Weight stable. Teeth in good shape. Vaccines updated.",
      urgent: false,
    });
  }

  if (status === "Special Needs") {
    records.push({
      title: "Leg Assessment",
      type: "Vet Visit",
      date: "Mar 1, 2026",
      description: "Ongoing leg condition monitored. Bandage protocol continues.",
      urgent: true,
    });
    records.push({
      title: "Pain Management Review",
      type: "Medication",
      date: "Mar 10, 2026",
      description: "Adjusted anti-inflammatory dosage. Recheck in 2 weeks.",
      urgent: true,
    });
  }

  if (i % 5 === 0) {
    records.push({
      title: "Dental Float",
      type: "Hoof & Dental",
      date: "Nov 5, 2025",
      description: "Routine dental float. Minor sharp points filed.",
      urgent: false,
    });
  }

  if (i % 7 === 0) {
    records.push({
      title: "Temperature Check (elevated)",
      type: "Vet Visit",
      date: "Mar 20, 2026",
      description: "Temp slightly elevated at 101.2°F. Monitoring — recheck tomorrow.",
      urgent: true,
    });
  }

  return records;
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
  { date: "APR 28", name: "Rosey", description: "Vaccination Booster", urgent: false },
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

  return {
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
    adoptedFrom: adoptedFromPool[i % adoptedFromPool.length],
    behavioralNotes:
      profile?.specialNeedsDetail || profile?.notes || behaviorPool[i % behaviorPool.length],
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
}

export const herds = [
  "Elsie's Herd",
  "Brave",
  "Unicorns",
  "Pegasus",
  "Seniors",
  "Pinky's Herd",
  "Dragons",
  "Angels",
  "Legacy",
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

export const animals: Animal[] = [
  // ── Elsie's Herd (22) ──
  makeDonkey("Elsie", "Elsie's Herd", idx++, { sex: "Jenny", age: "10 yr old", origin: "Wild — Death Valley, CA", traits: ["Leader", "Nurturing", "Calm"], bestFriends: ["Fred", "Buster"], tagline: "The matriarch of her herd" }),
  makeDonkey("Fred", "Elsie's Herd", idx++, { sex: "Gelding", age: "9 yr old", traits: ["Gentle", "Loyal"], bestFriends: ["Elsie"] }),
  makeDonkey("Berkley", "Elsie's Herd", idx++, { sex: "Jack", age: "6 yr old", traits: ["Playful", "Bold"] }),
  makeDonkey("Buster", "Elsie's Herd", idx++, { sex: "Gelding", age: "12 yr old", traits: ["Steady", "Social"], bestFriends: ["Elsie", "Fernie"] }),
  makeDonkey("Nakoa", "Elsie's Herd", idx++, { sex: "Jack", age: "5 yr old", traits: ["Curious", "Energetic"] }),
  makeDonkey("Herman", "Elsie's Herd", idx++, { sex: "Gelding", age: "14 yr old", traits: ["Wise", "Calm"] }),
  makeDonkey("Nelley", "Elsie's Herd", idx++, { sex: "Jenny", age: "8 yr old", traits: ["Sweet", "Shy"] }),
  makeDonkey("Athena", "Elsie's Herd", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Confident", "Protective"] }),
  makeDonkey("Portia", "Elsie's Herd", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Gentle", "Trusting"] }),
  makeDonkey("Elizabeth", "Elsie's Herd", idx++, { sex: "Jenny", age: "11 yr old", traits: ["Dignified", "Calm"] }),
  makeDonkey("Ashley", "Elsie's Herd", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Playful", "Social"] }),
  makeDonkey("Princes", "Elsie's Herd", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Sweet", "Curious"] }),
  makeDonkey("Bo", "Elsie's Herd", idx++, { sex: "Jack", age: "7 yr old", traits: ["Independent", "Strong"] }),
  makeDonkey("Pepper", "Elsie's Herd", idx++, {
    sex: "Jenny",
    age: "6 yr old",
    origin: "Rescue — Neglect Case",
    traits: ["Spunky", "Brave", "Food-lover", "Energetic"],
    bestFriends: ["Dusty", "Clover"],
    tagline: "First one to the feed bucket",
    story: [
      "Pepper was rescued from a neglect case — underweight, scared, and unsure of people. It didn't take long for her true personality to come roaring out. Now she's the first one to the feed bucket, every single time.",
      "She has a big personality packed into a small frame. She'll nudge you until you pay attention, and she's never met a carrot she didn't like.",
    ],
  }),
  makeDonkey("Bella", "Elsie's Herd", idx++, { sex: "Jenny", age: "8 yr old", traits: ["Gentle", "Loving"] }),
  makeDonkey("Bob", "Elsie's Herd", idx++, { sex: "Gelding", age: "13 yr old", traits: ["Laid-back", "Friendly"] }),
  makeDonkey("Sofie", "Elsie's Herd", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Curious", "Playful"] }),
  makeDonkey("J-Donk", "Elsie's Herd", idx++, { sex: "Jack", age: "9 yr old", traits: ["Goofy", "Social"] }),
  makeDonkey("Will", "Elsie's Herd", idx++, { sex: "Gelding", age: "10 yr old", traits: ["Stoic", "Reliable"] }),
  makeDonkey("Moses", "Elsie's Herd", idx++, { sex: "Jack", age: "11 yr old", traits: ["Wise", "Gentle"] }),
  makeDonkey("Peter", "Elsie's Herd", idx++, { sex: "Gelding", age: "15 yr old", traits: ["Elder", "Calm"], tags: [{ label: "Senior Care", color: "amber" }] }),
  makeDonkey("Wendy", "Elsie's Herd", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Affectionate", "Trusting"] }),
  makeDonkey("Jethro", "Elsie's Herd", idx++, { sex: "Jack", age: "1 yr old", traits: ["Young", "Curious"], tagline: "Sophie's surrogate baby" }),
  makeDonkey("Jemma", "Elsie's Herd", idx++, { sex: "Jenny", age: "1 yr old", traits: ["Young", "Sweet"], tagline: "Sophie's surrogate baby" }),

  // ── Brave (17) ──
  makeDonkey("Leilani", "Brave", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Graceful", "Loving"], bestFriends: ["Ophelia"] }),
  makeDonkey("Ophelia", "Brave", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Sweet", "Gentle"], bestFriends: ["Leilani"] }),
  makeDonkey("Star", "Brave", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Bright", "Curious"] }),
  makeDonkey("Elanora", "Brave", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Regal", "Calm"] }),
  makeDonkey("Asher", "Brave", idx++, { sex: "Jack", age: "5 yr old", traits: ["Brave", "Guiding"], bestFriends: ["Gabriel", "Halo"], tagline: "Gabriel's mentor in the Brave Herd" }),
  makeDonkey("Angel", "Brave", idx++, { sex: "Jenny", age: "8 yr old", traits: ["Gentle", "Protective"] }),
  makeDonkey("Saraphina", "Brave", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Elegant", "Trusting"] }),
  makeDonkey("Celeste", "Brave", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Dreamy", "Peaceful"] }),
  makeDonkey("Dawn", "Brave", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Energetic", "Playful"] }),
  makeDonkey("Dusky", "Brave", idx++, { sex: "Jack", age: "7 yr old", traits: ["Quiet", "Observant"] }),
  makeDonkey("Gracie", "Brave", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Graceful", "Kind"] }),
  makeDonkey("Skyla", "Brave", idx++, { sex: "Jenny", age: "3 yr old", traits: ["Young", "Adventurous"] }),
  makeDonkey("Gabriel", "Brave", idx++, {
    sex: "Jack",
    age: "2 yr old",
    origin: "Wild — found by rancher",
    status: "Special Needs",
    tagline: "The miracle with a magic leg",
    traits: ["Resilient", "Playful", "Curious", "Brave"],
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
    behavioralNotes: "Prosthetic leg — requires daily bandage checks. Extremely social, loves connecting with other donkeys. High energy, playful. Adapting well to prosthetic.",
  }),
  makeDonkey("Merida", "Brave", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Fierce", "Independent"] }),
  makeDonkey("Danny Boy", "Brave", idx++, { sex: "Gelding", age: "9 yr old", traits: ["Gentle", "Steady"] }),
  makeDonkey("Finn", "Brave", idx++, { sex: "Jack", age: "4 yr old", traits: ["Bold", "Playful"] }),
  makeDonkey("Halo", "Brave", idx++, { sex: "Jenny", age: "3 yr old", traits: ["Playful", "Sweet"], bestFriends: ["Gabriel", "Asher"], tagline: "Gabriel's primary playmate" }),

  // ── Unicorns (10) ──
  makeDonkey("Luna", "Unicorns", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Dreamy", "Gentle"], bestFriends: ["Raineer"] }),
  makeDonkey("Raineer", "Unicorns", idx++, { sex: "Jack", age: "8 yr old", traits: ["Strong", "Protective"], bestFriends: ["Luna"] }),
  makeDonkey("Xander", "Unicorns", idx++, { sex: "Jack", age: "5 yr old", traits: ["Bold", "Curious"] }),
  makeDonkey("Maku", "Unicorns", idx++, { sex: "Gelding", age: "10 yr old", traits: ["Calm", "Wise"] }),
  makeDonkey("Olaf", "Unicorns", idx++, { sex: "Gelding", age: "7 yr old", traits: ["Goofy", "Friendly"] }),
  makeDonkey("Summer", "Unicorns", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Warm", "Social"] }),
  makeDonkey("Oscar", "Unicorns", idx++, { sex: "Gelding", age: "9 yr old", traits: ["Distinguished", "Calm"] }),
  makeDonkey("Solstice", "Unicorns", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Mystical", "Peaceful"] }),
  makeDonkey("Cinder", "Unicorns", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Quiet", "Sweet"] }),
  makeDonkey("Ella", "Unicorns", idx++, { sex: "Jenny", age: "3 yr old", traits: ["Young", "Playful"] }),

  // ── Pegasus (11) ──
  makeDonkey("Rosey", "Pegasus", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Sassy", "Bold"], bestFriends: ["Enzo"] }),
  makeDonkey("Enzo", "Pegasus", idx++, { sex: "Jack", age: "6 yr old", traits: ["Spirited", "Loyal"], bestFriends: ["Rosey"] }),
  makeDonkey("Farrah", "Pegasus", idx++, { sex: "Jenny", age: "8 yr old", traits: ["Elegant", "Trusting"] }),
  makeDonkey("Huck", "Pegasus", idx++, { sex: "Gelding", age: "5 yr old", traits: ["Adventurous", "Bold"] }),
  makeDonkey("Leialoha", "Pegasus", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Gentle", "Loving"] }),
  makeDonkey("Izabelle", "Pegasus", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Poised", "Sweet"] }),
  makeDonkey("Teo", "Pegasus", idx++, { sex: "Jack", age: "5 yr old", traits: ["Curious", "Energetic"] }),
  makeDonkey("Stella", "Pegasus", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Star quality", "Confident"] }),
  makeDonkey("Everest", "Pegasus", idx++, { sex: "Jack", age: "9 yr old", traits: ["Strong", "Steady"] }),
  makeDonkey("Kayla", "Pegasus", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Playful", "Social"] }),
  makeDonkey("Kai", "Pegasus", idx++, { sex: "Jack", age: "3 yr old", traits: ["Young", "Fearless"] }),

  // ── Seniors (8) ──
  makeDonkey("Edgar", "Seniors", idx++, {
    age: "25 yr old", sex: "Jack", origin: "Wild",
    traits: ["Wise", "Gentle", "Dignified"],
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }, { label: "Senior Care", color: "amber" }],
    sponsorable: true, tagline: "The distinguished elder",
    behavioralNotes: "Senior — needs softer feed (mash). Good with vet visits. Enjoys quiet company. Slow to rise in mornings.",
  }),
  makeDonkey("Winky", "Seniors", idx++, {
    age: "12 yr old", sex: "Jack", origin: "Wild",
    traits: ["Resilient", "Trusting", "Calm"],
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }, { label: "Senior Care", color: "amber" }],
    sponsorable: true, tagline: "One-eyed wonder",
    behavioralNotes: "Blind in one eye — always approach from his good side (left). Ground-level trough only. Loves mesquite pod treats.",
  }),
  makeDonkey("Swayze", "Seniors", idx++, { age: "20 yr old", sex: "Gelding", traits: ["Smooth", "Social"], tags: [{ label: "Senior Care", color: "amber" }], behavioralNotes: "Arthritis in hind legs. Needs joint supplement daily. Good temperament." }),
  makeDonkey("Tenzel", "Seniors", idx++, { age: "22 yr old", sex: "Gelding", traits: ["Stoic", "Reliable"], tags: [{ label: "Senior Care", color: "amber" }], behavioralNotes: "Slow eater — separate from food-aggressive donkeys. Very gentle." }),
  makeDonkey("Blossom", "Seniors", idx++, { age: "18 yr old", sex: "Jenny", traits: ["Sweet", "Calm"], tags: [{ label: "Senior Care", color: "amber" }], behavioralNotes: "Dental issues — soft food only. Loves being groomed." }),
  makeDonkey("Churro", "Seniors", idx++, { age: "19 yr old", sex: "Gelding", traits: ["Friendly", "Warm"], tags: [{ label: "Senior Care", color: "amber" }], behavioralNotes: "Weight management — monitor portions. Very treat-motivated." }),
  makeDonkey("Jasper", "Seniors", idx++, { age: "21 yr old", sex: "Jack", traits: ["Wise", "Observant"], tags: [{ label: "Senior Care", color: "amber" }], behavioralNotes: "Mild hearing loss. Use visual cues. Excellent with volunteers." }),
  makeDonkey("Rodney", "Seniors", idx++, { age: "17 yr old", sex: "Gelding", traits: ["Laid-back", "Gentle"], tags: [{ label: "Senior Care", color: "amber" }], behavioralNotes: "History of colic — monitor eating habits. Prefers shade in summer." }),
  makeDonkey("Mrs. Truman", "Seniors", idx++, {
    age: "Senior", sex: "Jenny",
    traits: ["Calm", "Gentle"],
    tags: [{ label: "Senior Care", color: "amber" }],
    tagline: "Surrendered to PVDR with Nelly Belle",
    behavioralNotes: "Surrendered by owner to PVDR on 12/20/20 alongside Nelly Belle and Blossom.",
  }),

  // ── Pinky's Herd (12) ──
  makeDonkey("Pink", "Pinky's Herd", idx++, {
    age: "4 yr old", sex: "Jenny", origin: "Wild — Death Valley, CA",
    tagline: "The Donkey Dreams Ambassador",
    profileImage: "/donkeys/pink/profile.jpeg",
    galleryImages: ["/donkeys/pink/%231.jpg", "/donkeys/pink/%232.jpg", "/donkeys/pink/%233.jpeg"],
    traits: ["Ambassador", "Resilient", "Loving", "OG"],
    bestFriends: ["Eli"],
    story: [
      "On Saturday, September 11, 2021 Donkey Dreams Sanctuary Founders, Amber and Edj, lives changed forever when Pink was born.",
      "Pink had a rough start to life. When she was born, her mom wasn't interested in being a mom so Amber had to bottle feed her.",
      "Despite Pink's early health challenges, she is now incredibly healthy. She lives with her best friend Eli, her two four legged moms and her two legged mom, Amber.",
    ],
    intakeDate: "Sep 2021",
    behavioralNotes: "The ambassador — greets every visitor. Extremely social and confident. Bonded deeply with Amber (co-founder). Loves adventures.",
  }),
  makeDonkey("Sandy", "Pinky's Herd", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild — Death Valley, CA",
    tagline: "Pink's mom, Death Valley original",
    profileImage: "/donkeys/sandy/profile-photo.jpg",
    traits: ["Wild heart", "Fun mom", "Trusting", "Playful"],
    bestFriends: ["Pink", "Rizzo"],
    intakeDate: "Sep 2021",
    behavioralNotes: "Wild Jenny — still warming to humans. Follows organic training approach. The 'fun mom' — plays with Pink and Eli regularly.",
  }),
  makeDonkey("Eli", "Pinky's Herd", idx++, {
    age: "4 yr old", sex: "Jack", origin: "Wild — Death Valley, CA",
    tagline: "Regal, reserved, and Pink's ride-or-die",
    profileImage: "/donkeys/eli/profile-photo.jpg",
    galleryImages: ["/donkeys/eli/%231.png", "/donkeys/eli/%232.png", "/donkeys/eli/%233.png"],
    traits: ["Regal", "Protective", "Reserved", "OG"],
    bestFriends: ["Pink"],
    intakeDate: "Sep 2021",
    behavioralNotes: "Quiet confidence. Protective of Pink and his moms. Possible half-brother to Pink. Alpha Jack tendencies.",
  }),
  makeDonkey("Rizzo", "Pinky's Herd", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild — Death Valley, CA",
    tagline: "Eli's mom, Pink's second mom",
    profileImage: "/donkeys/rizzo/profile-photo.jpg",
    traits: ["Devoted mom", "Independent", "Peaceful", "Wild heart"],
    bestFriends: ["Eli", "Sandy"],
    intakeDate: "Sep 2021",
    behavioralNotes: "Content being a mom. Doesn't crave human interaction — prefers grazing. Growing more comfortable with people over time. Smiles when she eats.",
  }),
  makeDonkey("Petey", "Pinky's Herd", idx++, {
    age: "28 yr old", sex: "Gelding", origin: "Domestic",
    tagline: "28 years old and living his best life",
    profileImage: "/donkeys/pete/profile-photo.jpg",
    galleryImages: ["/donkeys/pete/%231.jpg", "/donkeys/pete/%232.png", "/donkeys/pete/%233.jpg"],
    traits: ["Elder", "Survivor", "Romantic", "Free spirit"],
    bestFriends: ["Lila"],
    tags: [{ label: "Sponsor Available", color: "blue" }, { label: "Senior Care", color: "amber" }],
    sponsorable: true,
    behavioralNotes: "Senior — 28 years old. Lost previous bonded companion and nearly starved from grief. Now bonded with Lila. Loves guitar music (Edj plays for him). Needs senior mash + joint supplements.",
  }),
  makeDonkey("Lila", "Pinky's Herd", idx++, {
    age: "3 yr old", sex: "Jenny", origin: "Wild — Death Valley, CA",
    tagline: "Pete's girlfriend, big sis to the herd",
    profileImage: "/donkeys/lila/profile-photo.jpg",
    traits: ["Resilient", "Big sister", "Playful", "Supermodel"],
    bestFriends: ["Petey", "Pink"],
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
    behavioralNotes: "Recovered from difficult birth at young age. Rejected her foal initially. Now bonded with Pete. Big sister role to younger donkeys. Very photogenic.",
  }),
  makeDonkey("Lava", "Pinky's Herd", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Warm", "Bold"] }),
  makeDonkey("Obsidian", "Pinky's Herd", idx++, { sex: "Jack", age: "6 yr old", traits: ["Dark", "Mysterious", "Gentle"] }),
  makeDonkey("Venelope", "Pinky's Herd", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Sweet", "Playful"] }),
  makeDonkey("Ralphie", "Pinky's Herd", idx++, { sex: "Gelding", age: "8 yr old", traits: ["Friendly", "Loyal"] }),
  makeDonkey("Peggy", "Pinky's Herd", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Nurturing", "Calm"] }),
  makeDonkey("Cassidy", "Pinky's Herd", idx++, {
    age: "9 yr old", sex: "Gelding", origin: "Hoarding Rescue",
    status: "Special Needs",
    tagline: "Corrective hoof care warrior",
    traits: ["Determined", "Gentle", "Patient"],
    tags: [{ label: "Special Needs", color: "red" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
    behavioralNotes: "Hoarding rescue — corrective hoof care ongoing. Needs daily hoof therapy walk (15 min) and afternoon hoof soak. Very patient during treatment.",
  }),
  makeDonkey("Cora", "Pinky's Herd", idx++, {
    sex: "Jenny", age: "10 yr old", origin: "Saline Valley, CA",
    traits: ["Trusting", "Patient"],
    tagline: "Returned from previous adoption",
    behavioralNotes: "Previously trained by Amy. Returned by SAC. Separated from her son, Vader, when he got adopted and she did not.",
  }),

  // ── Dragons (8) ──
  makeDonkey("Aurora", "Dragons", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Radiant", "Gentle"], bestFriends: ["Jett"] }),
  makeDonkey("Jett", "Dragons", idx++, { sex: "Jack", age: "6 yr old", traits: ["Fast", "Bold"], bestFriends: ["Aurora"] }),
  makeDonkey("Raya", "Dragons", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Fierce", "Loyal"] }),
  makeDonkey("Draco", "Dragons", idx++, { sex: "Jack", age: "7 yr old", traits: ["Strong", "Protective"] }),
  makeDonkey("Reiki", "Dragons", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Healing", "Calm"] }),
  makeDonkey("Remi", "Dragons", idx++, { sex: "Gelding", age: "6 yr old", traits: ["Charming", "Social"] }),
  makeDonkey("Cloudy", "Dragons", idx++, { sex: "Jenny", age: "3 yr old", traits: ["Dreamy", "Soft"] }),
  makeDonkey("Sky", "Dragons", idx++, { sex: "Jack", age: "4 yr old", traits: ["Free spirit", "Adventurous"] }),

  // ── Angels (7) ──
  makeDonkey("Jack Jack", "Angels", idx++, { sex: "Jack", age: "5 yr old", traits: ["Energetic", "Playful"], bestFriends: ["Arya"] }),
  makeDonkey("Arya", "Angels", idx++, { sex: "Jenny", age: "6 yr old", traits: ["Brave", "Noble"], bestFriends: ["Jack Jack", "Saphira"] }),
  makeDonkey("Saphira", "Angels", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Majestic", "Wise"], bestFriends: ["Arya"] }),
  makeDonkey("Oliver", "Angels", idx++, { sex: "Gelding", age: "8 yr old", traits: ["Gentle", "Kind"], bestFriends: ["Olivia"] }),
  makeDonkey("Olivia", "Angels", idx++, { sex: "Jenny", age: "7 yr old", traits: ["Sweet", "Loving"], bestFriends: ["Oliver"] }),
  makeDonkey("Zara", "Angels", idx++, { sex: "Jenny", age: "4 yr old", traits: ["Spirited", "Curious"] }),
  makeDonkey("Amira", "Angels", idx++, { sex: "Jenny", age: "5 yr old", traits: ["Graceful", "Peaceful"] }),

  // ── Legacy (4) ──
  makeDonkey("Gemma", "Legacy", idx++, { sex: "Jenny", age: "10 yr old", traits: ["Steadfast", "Warm"], tagline: "A legacy of love" }),
  makeDonkey("Winnie", "Legacy", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild",
    status: "Special Needs",
    tagline: "Don't judge this book by its cover",
    profileImage: "/donkeys/winnie/profile-photo.jpg",
    galleryImages: ["/donkeys/winnie/%231.jpg", "/donkeys/winnie/%232.jpg", "/donkeys/winnie/%233.jpg"],
    traits: ["Determined", "Protective", "Trusting", "Strong"],
    bestFriends: ["Shelley", "Jema"],
    tags: [{ label: "Special Needs", color: "red" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
    behavioralNotes: "Birth defect — twisted front legs, crooked back. Slow, deliberate walk. Extraordinary trust in humans. Nudges for attention. Two babies in the wild (Reno, Jema). Needs frequent hoof care.",
  }),
  makeDonkey("Shelley", "Legacy", idx++, {
    age: "18 yr old", sex: "Jenny", origin: "Wild",
    status: "Special Needs",
    tagline: "The strongest mama in the herd",
    profileImage: "/donkeys/shelley/profile-photo.jpg",
    galleryImages: ["/donkeys/shelley/%231.jpg", "/donkeys/shelley/%232.jpeg", "/donkeys/shelley/%233.jpg"],
    traits: ["Resilient", "Protective", "Loving", "Never gives up"],
    bestFriends: ["Jethro", "Amber"],
    tags: [{ label: "Special Needs", color: "red" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
    behavioralNotes: "Deformed front leg + crooked back since birth. Affected leg growing longer — now stands with it folded. Frequent leg bandaging and hoof care. Never refuses treatment. Loves kisses sessions after care.",
  }),
  makeDonkey("Fernie", "Legacy", idx++, {
    sex: "Jenny", age: "Adult", origin: "Wild — Antelope Preserve",
    tagline: "She waited a long time — but she made it",
    profileImage: "/donkeys/fernie/profile-photo.jpg",
    galleryImages: ["/donkeys/fernie/%231.jpg", "/donkeys/fernie/%232.jpg", "/donkeys/fernie/%233.jpg"],
    traits: ["Loyal", "Resilient", "Social", "Free spirit"],
    bestFriends: ["Elsie", "Buster"],
    tags: [{ label: "Healthy", color: "green" }, { label: "Sponsor Available", color: "blue" }],
    sponsorable: true,
    behavioralNotes: "History of multiple rehomings — can be wary initially. Now fully warmed up. First to approach for attention. Roams freely between herds. Finally home.",
  }),
];

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
