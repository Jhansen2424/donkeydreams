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
  isUnder3?: boolean;
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

// Age computed from the birth date at load time, NOT the age string baked in
// at import time — so donkeys tick over on their birthdays without waiting
// for the next spreadsheet import. Falls back to the imported string when no
// birth date is on file.
function liveAge(birthDateIso: string | null | undefined, fallback: string): string {
  if (!birthDateIso) return fallback;
  const birth = new Date(birthDateIso + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return fallback;
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 1) {
    const months = Math.max(
      1,
      Math.round((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    return `${months} mo old`;
  }
  return `${years} yr old`;
}

// Whole years old right now, or null when no valid birth date is on file.
function liveAgeYears(birthDateIso: string | null | undefined): number | null {
  if (!birthDateIso) return null;
  const birth = new Date(birthDateIso + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  return years;
}

// Card/list tag bubbles derived from the status flags, so they stay in sync
// with badge edits and fall off automatically on birthdays (Senior/Under 3
// come from the live age when a birth date exists).
export function deriveTags(a: {
  isSpecialNeedsFlag?: boolean;
  isOver20?: boolean;
  isUnder3?: boolean;
  sponsorable?: boolean;
}): Animal["tags"] {
  const tags: Animal["tags"] = [];
  if (a.isSpecialNeedsFlag) tags.push({ label: "Special Needs", color: "red" });
  if (a.isOver20) tags.push({ label: "Senior Care", color: "amber" });
  if (a.isUnder3) tags.push({ label: "Under 3", color: "blue" });
  if (a.sponsorable) tags.push({ label: "Sponsor Available", color: "blue" });
  return tags;
}

// Upcoming medical events (for dashboard).
// 2026-08-24: blank slate — the hardcoded placeholder events were removed.
// The dashboard falls back to this array only when the DB has no upcoming
// entries, so it must stay empty; real events come from /api/medical.
export const upcomingMedical: {
  date: string;
  name: string;
  description: string;
  urgent: boolean;
}[] = [];

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
  "isUnder3",
  "parents",
  "children",
  "bondedWith",
  "lastAnnualExam",
]);

// 2026-08-24: blank slate — the rotating dummy pools (ages, sexes, origins,
// intake dates, herd pens) and the synthesized per-donkey task/tag seeds were
// removed. Every field now comes from the adoption CSV (via donkeyProfiles)
// or stays empty until the new spreadsheets are imported. Only names and
// photos are retained.
function makeDonkey(
  name: string,
  herd: string,
  overrides: Partial<Animal> = {}
): Animal {
  const status = overrides.status ?? "Active";
  // Look up real adoption-CSV data for this donkey (if present)
  const profile = donkeyProfiles.get(name);

  // Strip CSV-owned fields from overrides — they cannot be hand-overridden.
  // Curated fields (profileImage, galleryImages, etc.) still win.
  const safeOverrides: Partial<Animal> = {};
  for (const k of Object.keys(overrides) as Array<keyof Animal>) {
    if (!CSV_OWNED_KEYS.has(k)) {
      (safeOverrides as Record<string, unknown>)[k] = overrides[k];
    }
  }

  // Age-based flags compute from the birth date when one exists (so donkeys
  // age out of "Under 3" / into "Senior" on their birthday automatically);
  // the sheet's explicit flag is the fallback for donkeys without one.
  const ageYears = liveAgeYears(profile?.birthDate);
  const isOver20 =
    ageYears !== null ? ageYears >= 20 : profile?.isOver20 ?? false;
  const isUnder3 =
    ageYears !== null ? ageYears < 3 : profile?.isUnder3 ?? false;

  const base: Animal = {
    name,
    slug: slug(name),
    age: liveAge(profile?.birthDate, profile?.age ?? ""),
    sex: profile?.sex ?? "",
    origin: profile?.origin ?? "",
    status,
    herd: profile?.herd ?? herd,
    pen: "",
    tags: deriveTags({
      isSpecialNeedsFlag: profile?.isSpecialNeeds ?? false,
      isOver20,
      isUnder3,
    }),
    traits: [],
    bestFriends: profile?.bondedWith ?? [],
    tagline: "",
    story: [],
    sponsorable: false,
    intakeDate: profile?.intakeDate ?? "",
    adoptedFrom: profile?.adoptedFrom ?? "",
    // Behavioral notes are intentionally empty until staff fills them in via
    // the app — no dummy data, no auto-fill from medical/special-needs columns.
    behavioralNotes: "",
    medicalRecords: [],
    tasks: [],
    // ── Adoption / identity fields ──
    birthDate: profile?.birthDate ?? null,
    color: profile?.color,
    size: profile?.size,
    microchip: profile?.microchip,
    needsChip: profile?.needsChip ?? false,
    momBabyCount: profile?.momBabyCount ?? 0,
    isBondedPair: profile?.isBondedPair ?? false,
    isSpecialNeedsFlag: profile?.isSpecialNeeds ?? false,
    isOver20,
    isUnder3,
    parents: profile?.parents ?? [],
    children: profile?.children ?? [],
    bondedWith: profile?.bondedWith ?? [],
    lastAnnualExam: profile?.lastAnnualExam ?? null,
    ...safeOverrides,
  };

  // Union of hand-coded bestFriends with parser-extracted bondedWith from the
  // adoption Notes column. Self-references are dropped.
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
// Herd assignments were wiped with the rest of the profile data — the list
// is kept so the tabs, dropdowns, and map page still work, and so the new
// spreadsheets can re-assign donkeys to herds on import.
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
  "Wilds",
] as const;

export type HerdName = (typeof herds)[number];

// Roster of every donkey at the sanctuary. Names and photos only — all other
// data comes from the adoption CSV (empty until the new spreadsheets are
// imported). Herd assignments are intentionally blank.
const _animalsRaw: Animal[] = [
  makeDonkey("Elsie", ""),
  makeDonkey("Fred", ""),
  makeDonkey("Berkley", ""),
  makeDonkey("Buster", ""),
  makeDonkey("Nakoa", ""),
  makeDonkey("Herman", ""),
  makeDonkey("Nelly Belle", ""),
  makeDonkey("Athena", ""),
  makeDonkey("Portia", ""),
  makeDonkey("Elizabeth", ""),
  makeDonkey("Ashley", ""),
  makeDonkey("Princess", ""),
  makeDonkey("Bo", ""),
  makeDonkey("Pepper", ""),
  makeDonkey("Bella", ""),
  makeDonkey("Bob", ""),
  makeDonkey("Sophie", ""),
  makeDonkey("Will", ""),
  makeDonkey("Moses", ""),
  makeDonkey("Peter", ""),
  makeDonkey("Wendy", ""),
  makeDonkey("Jethro", ""),
  makeDonkey("Jemma", ""),
  makeDonkey("Leilani", ""),
  makeDonkey("Ophelia", ""),
  makeDonkey("Star", ""),
  makeDonkey("Elanora", ""),
  makeDonkey("Asher", ""),
  makeDonkey("Angel", ""),
  makeDonkey("Seraphina", ""),
  makeDonkey("Celeste", ""),
  makeDonkey("Dawn", ""),
  makeDonkey("Dusk", ""),
  makeDonkey("Gracie", ""),
  makeDonkey("Skyla (Skye)", ""),
  makeDonkey("Gabriel", ""),
  makeDonkey("Merida", ""),
  makeDonkey("Danny Boy", ""),
  makeDonkey("Finn", ""),
  makeDonkey("Halo", ""),
  makeDonkey("Luna", ""),
  makeDonkey("Rainier", ""),
  makeDonkey("Xander", ""),
  makeDonkey("Makuahine Hau", ""),
  makeDonkey("Olaf", ""),
  makeDonkey("Summer", ""),
  makeDonkey("Oscar", ""),
  makeDonkey("Solstice", ""),
  makeDonkey("Cinder", ""),
  makeDonkey("Ella", ""),
  makeDonkey("Rosie", ""),
  makeDonkey("Enzo", ""),
  makeDonkey("Farrah", ""),
  makeDonkey("Huck", ""),
  makeDonkey("Leialoha", ""),
  makeDonkey("Izabella (Izzy)", ""),
  makeDonkey("Teo", ""),
  makeDonkey("Stella", ""),
  makeDonkey("Everest", ""),
  makeDonkey("Kai-Ya", ""),
  makeDonkey("Kai", ""),
  // Blossom, Mrs. Truman, Rodney, J-Donk, Gemma, Cora removed 2026-09-02 at
  // the sanctuary's request (not on the FINAL adoption sheet).
  makeDonkey("Edgar", ""),
  makeDonkey("Winky", ""),
  makeDonkey("Swayze", ""),
  makeDonkey("Tenzel", ""),
  makeDonkey("Churro", ""),
  makeDonkey("Jasper", ""),
  makeDonkey("Pink", "", {
    profileImage: "/donkeys/pink/profile.jpeg",
    galleryImages: ["/donkeys/pink/%231.jpg", "/donkeys/pink/%232.jpg", "/donkeys/pink/%233.jpeg"],
  }),
  makeDonkey("Sandy", "", {
    profileImage: "/donkeys/sandy/profile-photo.jpg",
  }),
  makeDonkey("Eli", "", {
    profileImage: "/donkeys/eli/profile-photo.jpg",
    galleryImages: ["/donkeys/eli/%231.png", "/donkeys/eli/%232.png", "/donkeys/eli/%233.png"],
  }),
  makeDonkey("Rizzo", "", {
    profileImage: "/donkeys/rizzo/profile-photo.jpg",
  }),
  makeDonkey("Pete", "", {
    profileImage: "/donkeys/pete/profile-photo.jpg",
    galleryImages: ["/donkeys/pete/%231.jpg", "/donkeys/pete/%232.png", "/donkeys/pete/%233.jpg"],
  }),
  makeDonkey("Lila", "", {
    profileImage: "/donkeys/lila/profile-photo.jpg",
  }),
  makeDonkey("Lava", ""),
  makeDonkey("Obsidian", ""),
  makeDonkey("Vanellope", ""),
  makeDonkey("Ralphie", ""),
  makeDonkey("Peggy", ""),
  makeDonkey("Cassidy", ""),
  makeDonkey("Aurora", ""),
  makeDonkey("Jett", ""),
  makeDonkey("Raya", ""),
  makeDonkey("Draco", ""),
  makeDonkey("Reiki", ""),
  makeDonkey("Remi", ""),
  makeDonkey("Cloud", ""),
  makeDonkey("Sky", ""),
  makeDonkey("Jack Jack", ""),
  makeDonkey("Arya", ""),
  makeDonkey("Saphira", ""),
  makeDonkey("Oliver", ""),
  makeDonkey("Olivia", ""),
  makeDonkey("Zara", ""),
  makeDonkey("Amira", ""),
  makeDonkey("Winnie", "", {
    profileImage: "/donkeys/winnie/profile-photo.jpg",
    galleryImages: ["/donkeys/winnie/%231.jpg", "/donkeys/winnie/%232.jpg", "/donkeys/winnie/%233.jpg"],
  }),
  makeDonkey("Shelley", "", {
    profileImage: "/donkeys/shelley/profile-photo.jpg",
    galleryImages: ["/donkeys/shelley/%231.jpg", "/donkeys/shelley/%232.jpeg", "/donkeys/shelley/%233.jpg"],
  }),
  makeDonkey("Fernie", "", {
    profileImage: "/donkeys/fernie/profile-photo.jpg",
    galleryImages: ["/donkeys/fernie/%231.jpg", "/donkeys/fernie/%232.jpg", "/donkeys/fernie/%233.jpg"],
  }),
];

// Public export — alphabetized within each herd, preserving the cross-herd
// order defined by `herds`. Animals whose herd isn't in the canonical list
// (including the blank-slate "" herd) come last, alphabetized.
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

// Live counts derived from the roster (all zero until herds are re-imported).
export const herdCounts: Record<HerdName, number> = (() => {
  const counts = {} as Record<HerdName, number>;
  for (const h of herds) {
    counts[h] = animals.filter((a) => a.herd === h).length;
  }
  return counts;
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
  return { completed: 0, total };
}
