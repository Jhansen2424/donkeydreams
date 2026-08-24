/**
 * Parses src/lib/data/donkey-adoption.csv into:
 *   - donkeyProfiles: Map<animalName, DonkeyProfile> — canonical identity data
 *   - annualExamEntries: MedicalEntry[] — Last Annual Exam dates as Vet Visit records
 *   - revisedMedicalEntries: MedicalEntry[] — Medical / Special Needs column text
 *   - sanctuaryStats: { momBaby, bondedPairs, specialNeeds, seniors, needsChip }
 *
 * Writes src/lib/donkey-profiles-data.ts.
 *
 * CSV layout — the "Donkey Adoption List APP FINAL" format (exported from the
 * Numbers sheet via scripts/xlsx-to-adoption-csv.py). One unified sheet; the
 * old primary + REVISED-sidecar split is gone. Columns (0-indexed):
 *   0  Name
 *   1  mom/baby        (count of babies; blank = not a mom)
 *   2  bonded          (0.5 per member of a bonded pair; sum = pair count)
 *   3  Special Needs   (flag: 1)
 *   4  Over 20         (flag: 1)
 *   5  Under 3 yrs     (flag: 1)
 *   6  Needs Chip?     (flag: 1)
 *   7  Herd
 *   8  Gender
 *   9  Size
 *  10  Color
 *  11  Adopted (intake date)
 *  12  Avid # (microchip)
 *  13  Birth Date
 *  14  Origin
 *  15  Relationships   (clean family/bonded text — parsed for links)
 *  16  Notes
 *  17  Medical         (free text → Condition entries)
 *  18  Special Needs   (free text → Special Needs entries)
 *  19  Last Annual Exam
 *  20  Trim History        → adoptionTrimVisits (hoof visits; "N/A" skipped)
 *  21-25  Dewormed Date / Deworming History / Next Vaccination /
 *         Vaccination History / Vaccination Date — NOT parsed here. The
 *         dedicated Deworming & Vaccination Checklist sheet supersedes these
 *         columns (it carries the same history plus everything newer); see
 *         scripts/parse-deworming-csv.ts.
 *
 * Run: npx tsx scripts/parse-adoption-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "donkey-adoption.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "donkey-profiles-data.ts");

// CSV name → app-canonical name. The adoption spreadsheet is the source of
// truth; these overrides exist for (a) multi-word names whose default
// title-case would be wrong ("JACK JACK" → "Jack Jack") and (b) parenthetical
// nicknames that the app surfaces as the primary name.
const NAME_OVERRIDES: Record<string, string> = {
  "JACK JACK": "Jack Jack",
  "DANNY BOY": "Danny Boy",
  "ISABELLA (IZZY)": "Izabella (Izzy)",
  "SKYLA (SKYE)": "Skyla (Skye)",
  "NELLY BELLE": "Nelly Belle",
  ELENORA: "Elanora", // recurring sheet typo (also appears in relationship text)
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
// "Senior" (singular) folds into "Seniors".
function normalizeHerd(raw: string): string {
  const t = raw.trim();
  if (t === "Elsie") return "Elsie's Herd";
  if (t === "Pink") return "Pinky's Herd";
  if (t === "Senior") return "Seniors";
  return t; // Brave, Angels, Pegasus, Dragons, Unicorns, Seniors, Legacy stay as-is
}

// Extract family relationships from the Relationships column.
// Patterns: "Mom of X", "Mother of X and Y", "Son of X", "Daughter of X",
// "Foal of X", "Mom is X", "Mother is X", "Father of X", "Sister of X",
// "Brother of X", "Brother to X", "Sister to X", "Grandma of X".
function extractFamily(notes: string): {
  parents: string[];
  children: string[];
  childCount: number; // fallback for momBabyCount when the flag column is blank
} {
  const parents: string[] = [];
  const children: string[] = [];
  if (!notes) return { parents, children, childCount: 0 };

  // Children-producing patterns ("X is parent of …" or "Surrogate Mom to Y").
  // The character class includes `,` so lists like "Mother of Ashley, Portia
  // and Elizabeth" capture as a single match — without the comma in the
  // class, the lazy quantifier can't grow past the first name. Stop the
  // capture at sentence-ending punctuation, parens, or a follow-on clause
  // like "Bonded with…" / "Close with…" so those don't bleed into the list.
  const childRegex =
    /(?:\bmom\b|\bmother\b|foster mom|surrogate mom|\bfather\b|\bgrandma\b)\s+(?:of|to)\s+([A-Z][a-zA-Z\s&,]+?)(?=[.()]|,\s*(?:surrogate|foster|father|grandma|bonded|close|brother|sister|now)\b|\s+(?:bonded|close|brother|sister|now|surrogate|foster)\b|$)/gi;
  // Parent-pointing patterns ("X is child of …")
  const parentRegex =
    /(?:son|daughter|foal|orphan son|orphan daughter)\s+(?:of|is)\s+([A-Z][a-zA-Z\s,]+?)(?:[,.]|$| and | bonded| close| brother| sister)/gi;
  const momIsRegex = /(?:\bmom\b|\bmother\b)\s+is\s+([A-Z][a-zA-Z\s,]+?)(?:[,.()]|$| and )/gi;

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

// Extract bonded companions from the Relationships column.
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

// Extract a date from a Trim History cell — "Last PVDR trim 10/5/24" or
// "Trimmed July 2025" (month-name → first of month).
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
function parseTrimDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let year = m[3];
    if (year.length === 2) year = "20" + year;
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const mn = text.toLowerCase().match(new RegExp(`(${MONTHS.join("|")})\\s+(\\d{4})`));
  if (mn) {
    const month = String(MONTHS.indexOf(mn[1]) + 1).padStart(2, "0");
    return `${mn[2]}-${month}-01`;
  }
  return null;
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
  adoptedFrom: string; // not in the FINAL sheet — kept for interface stability
  intakeDate: string | null; // ISO
  microchip: string | null; // null if no chip
  needsChip: boolean;
  notes: string;
  specialNeedsDetail: string;
  // Adoption flags (from the sheet's explicit flag columns)
  momBabyCount: number; // 0 = neither, 1+ = mom of N
  isBondedPair: boolean;
  isSpecialNeeds: boolean;
  isOver20: boolean;
  isUnder3: boolean;
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
// Medical entries derived from the Medical + Special Needs text columns.
// Type is determined by prefix:
//   "Condition: <text>"  → Condition
//   "Incident:  <text>"  → Incident
//   anything in the Special Needs column → Special Needs
//   un-prefixed Medical text → Condition (default)
const revisedMedicalEntries: Array<{
  animal: string;
  type: "Condition" | "Incident" | "Special Needs";
  title: string;
  description: string;
}> = [];
let unprefixedCount = 0;

let totalMomBaby = 0;
let totalBondedPairs = 0;
let totalSpecialNeeds = 0;
let totalOver20 = 0;
let totalUnder3 = 0;
let totalNeedsChip = 0;

// Hoof visits parsed from the Trim History column.
const trimVisits: Array<{ animal: string; date: string; notes: string; provider: string }> = [];

for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const csvName = cols[0]?.trim();
  if (!csvName) continue;

  const animalName = resolveName(csvName);

  const momBabyFlag = parseInt(cols[1]?.trim() || "", 10);
  const bondedFlag = parseFloat(cols[2]?.trim() || "");
  const specialFlag = (cols[3]?.trim() || "") !== "";
  const over20Flag = (cols[4]?.trim() || "") !== "";
  const under3Flag = (cols[5]?.trim() || "") !== "";
  const needsChipFlag = (cols[6]?.trim() || "") !== "";

  const herdRaw = cols[7]?.trim() || "";
  const sex = cols[8]?.trim() || "";
  const size = cols[9]?.trim() || "";
  const color = cols[10]?.trim() || "";
  const intakeDate = normalizeDate(cols[11]?.trim() || "");
  const chipRaw = cols[12]?.trim() || "";
  const birthDate = normalizeDate(cols[13]?.trim() || "");
  const origin = cols[14]?.trim() || "";
  const relationships = cols[15]?.trim() || "";
  const notes = cols[16]?.trim() || "";
  const medical = cols[17]?.trim() || "";
  const specialNeedsText = cols[18]?.trim() || "";
  const lastAnnualExam = normalizeDate(cols[19]?.trim() || "");
  const trimHistory = cols[20]?.trim() || "";

  // Microchip: anything that looks like a number/dashed number is a real chip.
  // Normalize Avid # formatting — some entries use 977-200-101-226-644,
  // others 985141001452635 (no dashes). Strip ALL non-digits, then re-insert
  // dashes every 3 digits so the displayed value is always uniform.
  const looksLikeChip = /^[0-9\- ]{6,}$/.test(chipRaw);
  let microchip: string | null = null;
  if (looksLikeChip) {
    const digits = chipRaw.replace(/\D/g, "");
    if (digits.length >= 9) {
      microchip = digits.replace(/(\d{3})(?=\d)/g, "$1-");
    } else {
      microchip = digits;
    }
  }
  // The sheet's explicit "Needs Chip?" flag is the source of truth.
  const needsChip = needsChipFlag;

  const family = extractFamily(relationships || notes);
  const bondedWith = extractBonded(relationships || notes);

  const specialNeedsDetail = specialNeedsText || medical;

  // Flags: the sheet's explicit flag columns are authoritative — a blank cell
  // means "no", even when the Relationships/Notes text mentions family or
  // bonds. Text extraction only feeds the parents/children/bondedWith link
  // lists, never the flags, so the app's stats match the sheet's totals row.
  const momBabyCount = Number.isFinite(momBabyFlag) ? momBabyFlag : 0;
  const isBondedPair = Number.isFinite(bondedFlag) && bondedFlag > 0;
  const isSpecialNeeds = specialFlag;
  const isOver20 = over20Flag;
  const isUnder3 = under3Flag;

  totalMomBaby += momBabyCount;
  if (Number.isFinite(bondedFlag)) totalBondedPairs += bondedFlag;
  if (isSpecialNeeds) totalSpecialNeeds++;
  if (isOver20) totalOver20++;
  if (isUnder3) totalUnder3++;
  if (needsChip) totalNeedsChip++;

  // ── Trim History column ──
  if (trimHistory && trimHistory.toUpperCase() !== "N/A") {
    const trimDate = parseTrimDate(trimHistory);
    if (trimDate) {
      trimVisits.push({
        animal: animalName,
        date: trimDate,
        notes: trimHistory,
        provider: /PVDR/i.test(trimHistory) ? "PVDR" : "",
      });
    }
  }

  profiles.set(animalName, {
    name: animalName,
    herd: normalizeHerd(herdRaw),
    sex,
    size,
    color,
    birthDate,
    age: calcAge(birthDate),
    origin,
    adoptedFrom: "",
    intakeDate,
    microchip,
    needsChip,
    notes: notes || relationships,
    specialNeedsDetail,
    momBabyCount,
    isBondedPair,
    isSpecialNeeds,
    isOver20,
    isUnder3,
    lastAnnualExam,
    parents: family.parents,
    children: family.children,
    bondedWith,
  });

  if (lastAnnualExam) {
    annualExams.push({ animal: animalName, date: lastAnnualExam });
  }

  // Emit medical entries from the Medical column.
  // Format: "Condition: ..." or "Incident: ..." (case-insensitive). Multiple
  // prefixed segments in one cell are split apart so each becomes its own
  // row. Un-prefixed text (the common case in the FINAL sheet) becomes a
  // single Condition entry.
  if (medical) {
    const segments = medical.split(/(?=\b(?:Condition|Incident):\s*)/gi)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const seg of segments) {
      const m = seg.match(/^(Condition|Incident):\s*([\s\S]*)$/i);
      if (m) {
        const type = m[1].toLowerCase() === "incident" ? "Incident" : "Condition";
        const desc = m[2].trim();
        if (desc) {
          revisedMedicalEntries.push({
            animal: animalName,
            type,
            title: type === "Incident" ? "Incident" : "Condition",
            description: desc,
          });
        }
      } else {
        unprefixedCount++;
        revisedMedicalEntries.push({
          animal: animalName,
          type: "Condition",
          title: "Condition",
          description: seg,
        });
      }
    }
  }

  // Emit a Special Needs medical entry from the Special Needs text column.
  if (specialNeedsText) {
    revisedMedicalEntries.push({
      animal: animalName,
      type: "Special Needs",
      title: "Special Needs",
      description: specialNeedsText,
    });
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

// Medical entries from the sheet's Medical / Special Needs columns. Date is
// the latest annual-exam date for the animal if available, otherwise today —
// these are profile-level facts, not events, so the exact date matters less.
const todayIso = new Date().toISOString().split("T")[0];
const lastExamByAnimal = new Map<string, string>(
  annualExams.map((e) => [e.animal, e.date])
);
const revisedMedicalEntryRows = revisedMedicalEntries
  .map((e, idx) => {
    const date = lastExamByAnimal.get(e.animal) ?? todayIso;
    return `  { id: ${JSON.stringify(`med-import-${idx}`)}, animal: ${JSON.stringify(e.animal)}, type: ${JSON.stringify(e.type)}, title: ${JSON.stringify(e.title)}, date: ${JSON.stringify(date)}, description: ${JSON.stringify(e.description)}, urgent: false }`;
  })
  .join(",\n");

const trimVisitRows = trimVisits
  .map(
    (v, idx) =>
      `  { id: ${JSON.stringify(`trim-adopt-${idx}`)}, animal: ${JSON.stringify(v.animal)}, type: "hoof" as const, date: ${JSON.stringify(v.date)}, provider: ${JSON.stringify(v.provider)}, notes: ${JSON.stringify(v.notes)} }`
  )
  .join(",\n");

const out = `// AUTO-GENERATED by scripts/parse-adoption-csv.ts
// Source: src/lib/data/donkey-adoption.csv
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry } from "./medical-data";
import type { CareVisit } from "./hoof-dental-data";

export interface DonkeyProfile {
  name: string;
  herd: string;
  sex: string;
  size: string;
  color: string;
  birthDate: string | null;
  age: string;
  origin: string;
  adoptedFrom: string;
  intakeDate: string | null;
  microchip: string | null;
  needsChip: boolean;
  notes: string;
  specialNeedsDetail: string;
  momBabyCount: number;
  isBondedPair: boolean;
  isSpecialNeeds: boolean;
  isOver20: boolean;
  isUnder3: boolean;
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

// Profile-level medical entries imported from the adoption sheet's Medical
// and Special Needs columns. CSV-sourced and read-only in the UI
// (id prefix "med-import-").
export const revisedMedicalEntries: MedicalEntry[] = [
${revisedMedicalEntryRows},
];

// Hoof trims from the adoption sheet's Trim History column. Merged into
// visitHistory by hoof-dental-data.ts alongside the trimming-notes imports.
export const adoptionTrimVisits: CareVisit[] = [
${trimVisitRows}${trimVisitRows ? "," : ""}
];

export interface SanctuaryStats {
  totalDonkeys: number;
  momBaby: number;
  bondedPairs: number;
  specialNeeds: number;
  seniors: number;
  under3: number;
  needsChip: number;
}

export const sanctuaryStats: SanctuaryStats = {
  totalDonkeys: ${profiles.size},
  momBaby: ${totalMomBaby},
  bondedPairs: ${Math.round(totalBondedPairs)},
  specialNeeds: ${totalSpecialNeeds},
  seniors: ${totalOver20},
  under3: ${totalUnder3},
  needsChip: ${totalNeedsChip},
};
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Profiles parsed: ${profiles.size}`);
console.log(`  Annual exam entries: ${annualExams.length}`);
console.log(`  Medical entries (Condition/Incident/Special Needs): ${revisedMedicalEntries.length}`);
console.log(`  Trim visits from Trim History: ${trimVisits.length}`);
console.log(`  Stats: ${totalMomBaby} mom/baby, ${Math.round(totalBondedPairs)} bonded pairs, ${totalSpecialNeeds} special needs, ${totalOver20} seniors, ${totalUnder3} under 3, ${totalNeedsChip} need chip`);
if (unprefixedCount > 0) {
  console.log(`  (${unprefixedCount} Medical cells had no Condition:/Incident: prefix — imported as Condition)`);
}
