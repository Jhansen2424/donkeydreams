/**
 * Parses src/lib/data/donkey-adoption.csv into:
 *   - donkeyProfiles: Map<animalName, DonkeyProfile> — canonical identity data
 *   - annualExamEntries: MedicalEntry[] — Last Annual Exam dates as Vet Visit records
 *   - sanctuaryStats: { momBaby, bondedPairs, specialNeeds, seniors, needsChip }
 *
 * Writes src/lib/donkey-profiles-data.ts.
 *
 * CSV columns (0-indexed):
 *   0  Name
 *   1  Herd
 *   2  Gender
 *   3  Size
 *   4  Color
 *   5  Adopted (intake date)
 *   6  Avid # (microchip)
 *   7  Birth Date
 *   8  Origin
 *   9  Notes
 *  10  Medical
 *  11  Special Needs
 *  12  Last Annual Exam
 *  13  Trim History
 *  14  Dewormed Date
 *  15  Deworming History
 *  16  Next Vaccination
 *  17  Vaccination History
 *  18  Vaccination Date
 *
 * Run: npx tsx scripts/parse-adoption-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "donkey-adoption.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "donkey-profiles-data.ts");

// CSV name → app-canonical name. Apply minimal renames; the adoption CSV is the
// new source of truth, but we keep the existing app spellings to avoid breaking
// links and curated entries elsewhere.
const NAME_OVERRIDES: Record<string, string> = {
  "JACK JACK": "Jack Jack",
  "DANNY BOY": "Danny Boy",
  "ISABELLA (IZZY)": "Izabelle",
  "KAI-YA": "Kayla",
  "ROSIE": "Rosey",
  "SERAPHINA": "Saraphina",
  "SOPHIE": "Sofie",
  "PRINCESS": "Princes",
  "NELLY BELLE": "Nelley",
  "RAINIER": "Raineer",
  "MAKUAHINE HAU": "Maku",
  "VANELLOPE": "Venelope",
  "CLOUD": "Cloudy",
  "PETE": "Petey",
  "DUSK": "Dusky",
  "SKYLA (SKYE)": "Skyla",
};

function resolveName(csvName: string): string {
  const upper = csvName.trim().toUpperCase();
  if (NAME_OVERRIDES[upper]) return NAME_OVERRIDES[upper];
  return csvName
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function normalizeDate(raw: string): string | null {
  // Strip "Born " prefix and other non-date words
  const cleaned = raw.replace(/^born\s+/i, "").trim();
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) year = "20" + year;
  return `${year}-${month}-${day}`;
}

function calcAge(birthDateIso: string | null): string {
  if (!birthDateIso) return "Unknown";
  const birth = new Date(birthDateIso + "T00:00:00");
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 1) {
    const months = Math.max(1, Math.round((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return `${months} mo old`;
  }
  return `${years} yr old`;
}

function calcAgeYears(birthDateIso: string | null): number | null {
  if (!birthDateIso) return null;
  const birth = new Date(birthDateIso + "T00:00:00");
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  return years;
}

// Map CSV herd value → app's canonical herd name.
// "Senior" (singular, used for Churro) folds into "Seniors".
function normalizeHerd(raw: string): string {
  const t = raw.trim();
  if (t === "Elsie") return "Elsie's Herd";
  if (t === "Pink") return "Pinky's Herd";
  if (t === "Senior") return "Seniors";
  return t; // Brave, Angels, Pegasus, Dragons, Unicorns, Seniors, Legacy stay as-is
}

// Extract family relationships from notes column.
// Patterns: "Mom of X", "Mother of X and Y", "Son of X", "Daughter of X",
// "Foal of X", "Mom is X", "Mother is X", "Father of X", "Sister of X",
// "Brother of X", "Brother to X", "Sister to X", "Grandma of X".
function extractFamily(notes: string): {
  parents: string[];
  children: string[];
  childCount: number; // for momBabyCount stat
} {
  const parents: string[] = [];
  const children: string[] = [];
  if (!notes) return { parents, children, childCount: 0 };

  // Children-producing patterns ("X is parent of …" or "Surrogate Mom to Y").
  // Stop the capture at sentence-ending punctuation, parens, or a follow-on
  // clause like "Bonded with…" / "Close with…" so those don't bleed into
  // the children list.
  const childRegex =
    /(?:\bmom\b|\bmother\b|foster mom|surrogate mom|\bfather\b|\bgrandma\b)\s+(?:of|to)\s+([A-Z][a-zA-Z\s&]+?)(?=[.()]|,\s*(?:surrogate|foster|father|grandma|bonded|close|brother|sister|now)\b|\s+(?:bonded|close|brother|sister|now|surrogate|foster)\b|$)/gi;
  // Parent-pointing patterns ("X is child of …")
  const parentRegex =
    /(?:son|daughter|foal|orphan son|orphan daughter)\s+(?:of|is)\s+([A-Z][a-zA-Z\s]+?)(?:[,.]|$| and | bonded| close| brother| sister)/gi;
  const momIsRegex = /(?:\bmom\b|\bmother\b)\s+is\s+([A-Z][a-zA-Z\s]+?)(?:[,.()]|$| and )/gi;

  let m: RegExpExecArray | null;

  while ((m = childRegex.exec(notes)) !== null) {
    const list = m[1].trim();
    // Split on comma and "and" to capture "Mother of X, Y and Z"
    const names = list.split(/,|\sand\s/).map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      // Strip trailing words like "Sister to..." that the regex might catch
      const clean = name.replace(/\s+(sister|brother|bonded|close|now).*$/i, "").trim();
      if (clean && clean.length < 30 && /^[A-Z]/.test(clean)) {
        children.push(resolveName(clean));
      }
    }
  }
  while ((m = parentRegex.exec(notes)) !== null) {
    const name = m[1].trim();
    if (name && name.length < 30) parents.push(resolveName(name));
  }
  while ((m = momIsRegex.exec(notes)) !== null) {
    const name = m[1].trim();
    if (name && name.length < 30) parents.push(resolveName(name));
  }

  // Dedupe
  const uniqChildren = Array.from(new Set(children));
  const uniqParents = Array.from(new Set(parents));

  return { parents: uniqParents, children: uniqChildren, childCount: uniqChildren.length };
}

// Extract bonded companions from notes column.
function extractBonded(notes: string): string[] {
  if (!notes) return [];
  const bonded: string[] = [];
  const re = /(?:bonded with|buddies with|bonded to|close with|close connection with|now bonded with)\s+([^.]+?)(?:[.]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    const list = m[1].trim();
    const names = list.split(/,|\sand\s|&/).map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      // Drop trailing relationship words that bleed in
      const clean = name.replace(/\s+(sister|brother|son|daughter|herd).*$/i, "").trim();
      if (clean.length < 30 && /^[A-Z]/.test(clean)) {
        bonded.push(resolveName(clean));
      }
    }
  }
  return Array.from(new Set(bonded));
}

// ── Types ──
interface DonkeyProfile {
  name: string;
  herd: string;
  sex: string; // "Jenny" | "Jack" | "Gelding"
  size: string; // "Mini" | "Standard" | "Mammoth"
  color: string;
  birthDate: string | null; // ISO
  age: string; // calculated from birth date
  origin: string;
  intakeDate: string | null; // ISO
  microchip: string | null; // null if no chip
  needsChip: boolean;
  notes: string;
  specialNeedsDetail: string;
  // Adoption flags
  momBabyCount: number; // 0 = neither, 1+ = mom of N
  isBondedPair: boolean;
  isSpecialNeeds: boolean;
  isOver20: boolean;
  // Last annual exam (ISO)
  lastAnnualExam: string | null;
  // Extracted relationships
  parents: string[];
  children: string[];
  bondedWith: string[];
}

// ── Parse ──
const csv = readFileSync(CSV_PATH, "utf-8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);

const profiles: Map<string, DonkeyProfile> = new Map();
const annualExams: Array<{ animal: string; date: string }> = [];

let totalMomBaby = 0;
let totalBondedHalves = 0;
let totalSpecialNeeds = 0;
let totalOver20 = 0;
let totalNeedsChip = 0;

for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const csvName = cols[0]?.trim();
  if (!csvName) continue;

  const animalName = resolveName(csvName);

  const herdRaw = cols[1]?.trim() || "";
  const sex = cols[2]?.trim() || "";
  const size = cols[3]?.trim() || "";
  const color = cols[4]?.trim() || "";
  const intakeDate = normalizeDate(cols[5]?.trim() || "");
  const chipRaw = cols[6]?.trim() || "";
  const birthDate = normalizeDate(cols[7]?.trim() || "");
  const origin = cols[8]?.trim() || "";
  const notes = cols[9]?.trim() || "";
  const medical = cols[10]?.trim() || "";
  const specialNeeds = cols[11]?.trim() || "";
  const lastAnnualExam = normalizeDate(cols[12]?.trim() || "");

  // Microchip: anything that looks like a number/dashed number is a real chip;
  // blank or non-numeric → needs chip
  const looksLikeChip = /^[0-9\- ]{6,}$/.test(chipRaw);
  const microchip = looksLikeChip ? chipRaw.replace(/\s+/g, "") : null;
  const needsChip = !looksLikeChip;

  const family = extractFamily(notes);
  const bondedWith = extractBonded(notes);

  // Special Needs Detail: prefer the explicit Special Needs column,
  // fall back to Medical column if Special Needs is blank.
  const specialNeedsDetail = specialNeeds || medical;

  // Stats derivations:
  //   momBabyCount: number of unique children mentioned in notes
  //   isBondedPair: any bonded relationships listed
  //   isSpecialNeeds: any text in Special Needs column (medical alone doesn't count)
  //   isOver20: age in years ≥ 20
  //   needsChip: no valid microchip
  const ageYears = calcAgeYears(birthDate);
  const momBabyCount = family.childCount;
  const isBondedPair = bondedWith.length > 0;
  const isSpecialNeeds = specialNeeds.length > 0;
  const isOver20 = ageYears !== null && ageYears >= 20;

  totalMomBaby += momBabyCount;
  if (isBondedPair) totalBondedHalves++;
  if (isSpecialNeeds) totalSpecialNeeds++;
  if (isOver20) totalOver20++;
  if (needsChip) totalNeedsChip++;

  profiles.set(animalName, {
    name: animalName,
    herd: normalizeHerd(herdRaw),
    sex,
    size,
    color,
    birthDate,
    age: calcAge(birthDate),
    origin,
    intakeDate,
    microchip,
    needsChip,
    notes,
    specialNeedsDetail,
    momBabyCount,
    isBondedPair,
    isSpecialNeeds,
    isOver20,
    lastAnnualExam,
    parents: family.parents,
    children: family.children,
    bondedWith,
  });

  if (lastAnnualExam) {
    annualExams.push({ animal: animalName, date: lastAnnualExam });
  }
}

// ── Emit TS ──
function jsonOf(p: DonkeyProfile): string {
  return JSON.stringify(p);
}

const profileEntries = Array.from(profiles.entries())
  .map(([name, p]) => `  [${JSON.stringify(name)}, ${jsonOf(p)}]`)
  .join(",\n");

const examEntries = annualExams
  .map(
    (e, idx) =>
      `  { id: ${JSON.stringify(`med-exam-${idx}`)}, animal: ${JSON.stringify(e.animal)}, type: "Vet Visit", title: "Annual Exam", date: ${JSON.stringify(e.date)}, description: "Annual wellness exam (from adoption CSV).", urgent: false }`
  )
  .join(",\n");

const out = `// AUTO-GENERATED by scripts/parse-adoption-csv.ts
// Source: src/lib/data/donkey-adoption.csv
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry } from "./medical-data";

export interface DonkeyProfile {
  name: string;
  herd: string;
  sex: string;
  size: string;
  color: string;
  birthDate: string | null;
  age: string;
  origin: string;
  intakeDate: string | null;
  microchip: string | null;
  needsChip: boolean;
  notes: string;
  specialNeedsDetail: string;
  momBabyCount: number;
  isBondedPair: boolean;
  isSpecialNeeds: boolean;
  isOver20: boolean;
  lastAnnualExam: string | null;
  parents: string[];
  children: string[];
  bondedWith: string[];
}

export const donkeyProfiles: Map<string, DonkeyProfile> = new Map([
${profileEntries},
]);

export function getDonkeyProfile(animalName: string): DonkeyProfile | null {
  return donkeyProfiles.get(animalName) ?? null;
}

// Last annual exam dates → MedicalEntry records (one per donkey)
export const annualExamEntries: MedicalEntry[] = [
${examEntries},
];

export interface SanctuaryStats {
  totalDonkeys: number;
  momBaby: number;
  bondedPairs: number; // halves / 2
  specialNeeds: number;
  seniors: number;
  needsChip: number;
}

export const sanctuaryStats: SanctuaryStats = {
  totalDonkeys: ${profiles.size},
  momBaby: ${totalMomBaby},
  bondedPairs: ${Math.round(totalBondedHalves / 2)},
  specialNeeds: ${totalSpecialNeeds},
  seniors: ${totalOver20},
  needsChip: ${totalNeedsChip},
};
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Profiles parsed: ${profiles.size}`);
console.log(`  Annual exam entries: ${annualExams.length}`);
console.log(`  Stats: ${totalMomBaby} mom/baby, ${Math.round(totalBondedHalves / 2)} bonded pairs, ${totalSpecialNeeds} special needs, ${totalOver20} seniors, ${totalNeedsChip} need chip`);
