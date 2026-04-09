/**
 * Parses src/lib/data/donkey-adoption.csv into:
 *   - donkeyProfiles: Map<animalName, DonkeyProfile> — canonical identity data
 *   - annualExamEntries: MedicalEntry[] — Last Annual Exam dates as Vet Visit records
 *   - sanctuaryStats: { momBaby, bondedPairs, specialNeeds, seniors, needsChip }
 *
 * Writes src/lib/donkey-profiles-data.ts.
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
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
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

// Map CSV herd value → app's canonical herd name
function normalizeHerd(raw: string): string {
  const t = raw.trim();
  if (t === "Elsie") return "Elsie's Herd";
  if (t === "Pink") return "Pinky's Herd";
  return t; // Brave, Angels, Pegasus, Dragons, Unicorns, Seniors, Legacy stay as-is
}

// Extract family relationships from notes column
// Patterns: "Mom of X", "Mother of X", "Son of X", "Daughter of X", "Foal of X", "Mom is X"
function extractFamily(notes: string): {
  parents: string[];
  children: string[];
} {
  const parents: string[] = [];
  const children: string[] = [];
  if (!notes) return { parents, children };

  const childRegex = /(?:mom|mother|foster mom|surrogate mom)\s+(?:of|is)\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|$| and )/gi;
  const parentRegex = /(?:son|daughter|foal|orphan son)\s+of\s+([A-Z][a-zA-Z\s]+?)(?:[,.]|$| and )/gi;
  const momIsRegex = /mom is\s+([A-Z][a-zA-Z\s]+?)(?:[,.]|$| and )/gi;

  let m: RegExpExecArray | null;
  while ((m = childRegex.exec(notes)) !== null) {
    const name = m[1].trim().replace(/\s+and\s+.*$/, "");
    if (name && name.length < 30) children.push(resolveName(name));
  }
  while ((m = parentRegex.exec(notes)) !== null) {
    const name = m[1].trim();
    if (name && name.length < 30) parents.push(resolveName(name));
  }
  while ((m = momIsRegex.exec(notes)) !== null) {
    const name = m[1].trim();
    if (name && name.length < 30) parents.push(resolveName(name));
  }

  return { parents, children };
}

// Extract bonded companions from notes column
// Patterns: "bonded with X", "Bonded with X", "Buddies with X"
function extractBonded(notes: string): string[] {
  if (!notes) return [];
  const bonded: string[] = [];
  // Match "bonded with X, Y and Z" or "Buddies with X"
  const re = /(?:bonded with|buddies with|bonded to|close with)\s+([^.]+?)(?:[.]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    const list = m[1].trim();
    // Split on commas and "and"
    const names = list.split(/,|\sand\s/).map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      if (name.length < 30 && /^[A-Z]/.test(name)) {
        bonded.push(resolveName(name));
      }
    }
  }
  return bonded;
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
  microchip: string | null; // null if "needs chip"
  needsChip: boolean;
  notes: string;
  specialNeedsDetail: string;
  // Adoption flags
  momBabyCount: number; // 0 = neither, 1+ = mom of N
  isBondedPair: boolean; // half-pair flag from CSV
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

  // Skip totals row at the bottom (empty first column with numbers in others)
  if (!isNaN(Number(cols[1])) && cols[1] !== "" && !cols[6]) continue;

  const animalName = resolveName(csvName);

  const momBaby = parseFloat(cols[1]) || 0;
  const bonded = parseFloat(cols[2]) || 0;
  const specialNeedsFlag = parseFloat(cols[3]) || 0;
  const over20 = parseFloat(cols[4]) || 0;
  const needsChipFlag = parseFloat(cols[5]) || 0;

  totalMomBaby += momBaby;
  totalBondedHalves += bonded;
  if (specialNeedsFlag) totalSpecialNeeds++;
  if (over20) totalOver20++;
  if (needsChipFlag) totalNeedsChip++;

  const herdRaw = cols[6]?.trim() || "";
  const sex = cols[7]?.trim() || "";
  const size = cols[8]?.trim() || "";
  const color = cols[9]?.trim() || "";
  const intakeDate = normalizeDate(cols[10]?.trim() || "");
  const chipRaw = cols[11]?.trim() || "";
  const birthDate = normalizeDate(cols[12]?.trim() || "");
  const origin = cols[13]?.trim() || "";
  const notes = cols[14]?.trim() || "";
  const specialNeedsDetail = cols[15]?.trim() || "";
  const lastAnnualExam = normalizeDate(cols[16]?.trim() || "");

  // Microchip: anything that looks like a number/dashed number is a real chip;
  // "Need to order more chips", "Look up in Homeaway Scanner" etc → needs chip
  const looksLikeChip = /^[0-9\- ]{6,}$/.test(chipRaw);
  const microchip = looksLikeChip ? chipRaw.replace(/\s+/g, "") : null;
  const needsChip = needsChipFlag === 1 || !looksLikeChip;

  const family = extractFamily(notes);
  const bondedWith = extractBonded(notes);

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
    momBabyCount: momBaby,
    isBondedPair: bonded > 0,
    isSpecialNeeds: specialNeedsFlag === 1,
    isOver20: over20 === 1,
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
  bondedPairs: ${totalBondedHalves / 2},
  specialNeeds: ${totalSpecialNeeds},
  seniors: ${totalOver20},
  needsChip: ${totalNeedsChip},
};
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Profiles parsed: ${profiles.size}`);
console.log(`  Annual exam entries: ${annualExams.length}`);
console.log(`  Stats: ${totalMomBaby} mom/baby, ${totalBondedHalves / 2} bonded pairs, ${totalSpecialNeeds} special needs, ${totalOver20} seniors, ${totalNeedsChip} need chip`);
