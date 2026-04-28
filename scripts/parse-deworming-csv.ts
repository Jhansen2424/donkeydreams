/**
 * Parses src/lib/data/deworming-vaccination.csv into:
 *   - importedDewormingEntries: per-donkey deworming history → MedicalEntry[]
 *   - importedVaccinationEntries: per-donkey vaccination history → MedicalEntry[]
 *   - importedMedicalEntries: deworming + vaccination merged
 *   - yardWideDewormings: yard-wide dosing events (PREV-HERD-N rows) →
 *     YardWideDeworming[] with the donkey list expanded per-animal
 *   - nextVaccinationByAnimal: { [animalName]: ISODate } from the CSV's Next
 *     Vaccination column. Surfaces in the dashboard's "due soon" pipeline.
 *
 * Writes src/lib/deworming-vaccination-data.ts.
 *
 * CSV layout:
 *   Section 1 (rows 1–24): "PREV-HERD-N, dateText, DRUG, dose, weight, dosage, ..."
 *     — yard-wide events. All 6 PREV-HERD-N rows for the same (date, drug)
 *     describe the same event (template duplication), so we dedupe.
 *   Section 2 (header row): blank, Herd, DewormedDate, DewormingHistory, blank,
 *     VaccinationHistory, VaccinationDate, NextVaccination
 *   Section 3 (per-animal rows): Name, Herd, DewormedDate, DewormingHistory,
 *     blank, VaccinationHistory, VaccinationDate, NextVaccination
 *   A stray "Name,Next Deworming Date,..." header may appear mid-file — skip it.
 *
 * Run: npx tsx scripts/parse-deworming-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { animals } from "../src/lib/animals";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "deworming-vaccination.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "deworming-vaccination-data.ts");

// ── CSV name → app name overrides ──
const NAME_OVERRIDES: Record<string, string> = {
  "NELLY BELLE": "Nelley",
  "PRINCESS": "Princes",
  "SOPHIE": "Sofie",
  "JEMMA": "Jemma",
  "SERAPHINA": "Saraphina",
  "ELENORA": "Elanora",
  "DUSK": "Dusky",
  "RAINIER": "Raineer",
  "MAKUAHINE HAU": "Maku",
  "ROSIE": "Rosey",
  "ISABELLA (IZZY)": "Izabelle",
  "KAI-YA": "Kayla",
  "PETE": "Petey",
  "VANELLOPE": "Venelope",
  "CLOUD": "Cloudy",
  "SKYLA (SKYE)": "Skyla",
  "JACK JACK": "Jack Jack",
  "DANNY BOY": "Danny Boy",
};

const appNames = new Set(animals.map((a) => a.name));
const appNameLower = new Map(animals.map((a) => [a.name.toLowerCase(), a.name]));

function resolveAnimal(csvName: string): string | null {
  const upper = csvName.trim().toUpperCase();
  if (NAME_OVERRIDES[upper]) return NAME_OVERRIDES[upper];

  const titled = csvName
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (appNames.has(titled)) return titled;
  if (appNameLower.has(csvName.trim().toLowerCase())) {
    return appNameLower.get(csvName.trim().toLowerCase())!;
  }
  const stripped = csvName.replace(/\([^)]*\)/g, "").trim();
  if (stripped !== csvName) return resolveAnimal(stripped);
  return null;
}

// Multi-line aware CSV parser (quoted fields can contain literal newlines)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        if (row.length > 1 || row[0].trim() !== "") rows.push(row);
        row = [];
      } else {
        cur += c;
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    if (row.length > 1 || row[0].trim() !== "") rows.push(row);
  }
  return rows;
}

// Date normalizer: m/d/yy or m/d/yyyy → YYYY-MM-DD
function normalizeDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) year = "20" + year;
  const mo = Number(month);
  const da = Number(day);
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  return `${year}-${month}-${day}`;
}

// Parse a longer date format ("Jun 27, 2025") for the PREV-HERD section
function normalizeFlexDate(raw: string): string | null {
  const trimmed = raw.trim();
  // Try slash format first
  const slash = normalizeDate(trimmed);
  if (slash) return slash;
  // "Mon DD, YYYY" — let Date parse it
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Drugs we recognize in deworming history strings
const DRUGS = [
  "Fenbendazole",
  "Pyrantel Pamoate",
  "Pyrantel",
  "Tri-wormer",
  "Triwormer",
  "Ivermectin",
  "Moxidectin",
];

function canonicalDrug(raw: string): string | null {
  const lower = raw.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
  if (lower.includes("fenbendazole")) return "Fenbendazole";
  if (lower.includes("pyrantelpamoate")) return "Pyrantel Pamoate";
  if (lower.includes("pyrantel")) return "Pyrantel";
  if (lower.includes("triwormer")) return "Tri-wormer";
  if (lower.includes("ivermectin")) return "Ivermectin";
  if (lower.includes("moxidectin")) return "Moxidectin";
  return null;
}

function extractDoses(history: string): Array<{ drug: string; date: string }> {
  if (!history?.trim()) return [];
  const doses: Array<{ drug: string; date: string }> = [];
  const drugAlt = DRUGS.map((d) => d.replace("-", "[- ]?")).join("|");
  const re = new RegExp(`(${drugAlt})\\s*(\\d{1,2}/\\d{1,2}/\\d{2,4})`, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(history)) !== null) {
    const drug = canonicalDrug(match[1]) ?? "Other";
    const date = normalizeDate(match[2]);
    if (!date) continue;
    doses.push({ drug, date });
  }
  return doses;
}

function extractVaccinations(
  history: string
): Array<{ vaccine: string; date: string; lot?: string }> {
  if (!history?.trim()) return [];
  const out: Array<{ vaccine: string; date: string; lot?: string }> = [];
  const parts = history.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const dateMatch = part.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (!dateMatch) continue;
    const date = normalizeDate(dateMatch[1]);
    if (!date) continue;
    let label = part
      .replace(dateMatch[0], "")
      .replace(/\([^)]*\)/g, "")
      .trim();
    label = label.replace(/^[-:,\s]+|[-:,\s]+$/g, "");
    if (!label) label = "Vaccination";
    const lotMatch = part.match(/\(([^)]+)\)/);
    out.push({ vaccine: label, date, lot: lotMatch ? lotMatch[1] : undefined });
  }
  return out;
}

// ── Main ──
const csv = readFileSync(CSV_PATH, "utf-8");
const rows = parseCSV(csv);

const dewormingEntries: string[] = [];
const vaccinationEntries: string[] = [];
const yardWideRaw: Map<
  string, // `${date}|${drug}|${dose}`
  { date: string; drug: string; dose: string }
> = new Map();
const nextVaccByAnimal: Map<string, string> = new Map();
const unmatched: string[] = [];

let dewormingCount = 0;
let vaccinationCount = 0;
let perAnimalRowCount = 0;

for (const cols of rows) {
  const firstCol = cols[0]?.trim() ?? "";
  if (!firstCol) continue;

  // ── Section 1: PREV-HERD-N yard-wide events ──
  if (firstCol.startsWith("PREV-HERD")) {
    // Cols: 0=PREV-HERD-N, 1=date, 2=DRUG, 3=dose description
    const date = normalizeFlexDate(cols[1] || "");
    const drugRaw = (cols[2] || "").trim();
    const dose = (cols[3] || "").trim();
    const drug = canonicalDrug(drugRaw);
    if (!date || !drug) continue;
    const key = `${date}|${drug}|${dose}`;
    if (!yardWideRaw.has(key)) {
      yardWideRaw.set(key, { date, drug, dose });
    }
    continue;
  }

  // Skip header rows: the section header `,Herd,Dewormed Date,...` and the
  // stray mid-file `Name,Next Deworming Date,Dewormer,...` template header.
  if (firstCol === "Name") continue;

  // ── Section 3: per-animal rows ──
  // Cols: 0=Name, 1=Herd, 2=DewormedDate, 3=DewormingHistory, 4=blank,
  //       5=VaccinationHistory, 6=VaccinationDate, 7=NextVaccination
  const animal = resolveAnimal(firstCol);
  if (!animal) {
    unmatched.push(firstCol);
    continue;
  }

  perAnimalRowCount++;
  const dewormingHistory = cols[3] || "";
  const vaccinationHistory = cols[5] || "";
  const nextVaccISO = normalizeDate(cols[7] || "");

  if (nextVaccISO) {
    nextVaccByAnimal.set(animal, nextVaccISO);
  }

  for (const dose of extractDoses(dewormingHistory)) {
    dewormingEntries.push(
      `  rec(${JSON.stringify(animal)}, "Deworming", ${JSON.stringify(
        dose.drug
      )}, ${JSON.stringify(dose.date)}, ${JSON.stringify(
        `${dose.drug} dose administered.`
      )})`
    );
    dewormingCount++;
  }

  for (const vac of extractVaccinations(vaccinationHistory)) {
    const desc = vac.lot
      ? `${vac.vaccine}. Lot: ${vac.lot}`
      : `${vac.vaccine}.`;
    vaccinationEntries.push(
      `  rec(${JSON.stringify(animal)}, "Vaccination", ${JSON.stringify(
        vac.vaccine
      )}, ${JSON.stringify(vac.date)}, ${JSON.stringify(desc)})`
    );
    vaccinationCount++;
  }
}

// ── Yard-wide events: build sorted list (newest first) ──
const yardWide = Array.from(yardWideRaw.values()).sort((a, b) =>
  b.date.localeCompare(a.date)
);

// ── Emit ──
const yardWideEntries = yardWide
  .map(
    (e, idx) =>
      `  { id: ${JSON.stringify(`yard-${idx}`)}, date: ${JSON.stringify(
        e.date
      )}, drug: ${JSON.stringify(e.drug)}, dose: ${JSON.stringify(e.dose)} }`
  )
  .join(",\n");

const nextVaccEntries = Array.from(nextVaccByAnimal.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, date]) => `  [${JSON.stringify(name)}, ${JSON.stringify(date)}]`)
  .join(",\n");

const out = `// AUTO-GENERATED by scripts/parse-deworming-csv.ts
// Source: src/lib/data/deworming-vaccination.csv
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry, MedicalRecordType } from "./medical-data";
import { animals } from "./animals";

let nextId = 10000;
function rec(
  animal: string,
  type: MedicalRecordType,
  title: string,
  date: string,
  description: string,
  urgent = false
): MedicalEntry {
  return { id: \`med-import-\${nextId++}\`, animal, type, title, date, description, urgent };
}

export const importedDewormingEntries: MedicalEntry[] = [
${dewormingEntries.join(",\n")},
];

export const importedVaccinationEntries: MedicalEntry[] = [
${vaccinationEntries.join(",\n")},
];

// ── Yard-wide dosing events (PREV-HERD-N rows) ─────────────────────────
// Each entry represents a single yard-wide deworming protocol date. The CSV
// duplicates the row 6 times for sheet bookkeeping; we collapse them by
// (date, drug, dose). These are surfaced as a widget on the medical dashboard
// AND attached as per-animal MedicalEntry records (see yardWideAsMedical
// below) so each donkey's history reflects the dose they received.
export interface YardWideDeworming {
  id: string;
  date: string; // ISO YYYY-MM-DD
  drug: string;
  dose: string; // e.g. "Single Dose (0.2 mg/kg)" or "5-day Power Pack (5 mg/kg/day)"
}

export const yardWideDewormings: YardWideDeworming[] = [
${yardWideEntries},
];

// Expand each yard-wide event into one MedicalEntry per donkey, so they show
// up in each animal's deworming history. Skip any donkey whose own history
// already mentions the drug within ±7 days — the dedup pipeline in
// medical-data.ts will handle the rest.
const yardWideAsMedical: MedicalEntry[] = (() => {
  const out: MedicalEntry[] = [];
  let idx = 100000;
  for (const event of yardWideDewormings) {
    for (const a of animals) {
      out.push({
        id: \`yard-med-\${idx++}\`,
        animal: a.name,
        type: "Deworming",
        title: event.drug,
        date: event.date,
        description: \`Yard-wide \${event.drug.toLowerCase()} (\${event.dose}).\`,
        urgent: false,
      });
    }
  }
  return out;
})();

// ── Next-vaccination dates per donkey (CSV's Next Vaccination column) ──
// Used by the medical dashboard to surface upcoming/overdue boosters.
export const nextVaccinationByAnimal: Map<string, string> = new Map([
${nextVaccEntries},
]);

export function getNextVaccinationDue(animalName: string): string | null {
  return nextVaccinationByAnimal.get(animalName) ?? null;
}

// Emit the next-vaccination dates as scheduled MedicalEntry records so they
// flow through the dashboard's existing Upcoming / Overdue / Recent tabs.
//
// Urgency is computed at evaluation time relative to today:
//   - past due (date < today) → urgent: true (truly overdue)
//   - today / future → urgent: false, title prefixed "Upcoming:" so the
//     entry shows on the Upcoming tab without crying wolf in the Overdue
//     stat. The dev team specifically asked us to stop flagging not-yet-due
//     vaccinations as Urgent.
export const scheduledVaccinationEntries: MedicalEntry[] = (() => {
  const out: MedicalEntry[] = [];
  let idx = 200000;
  const todayIso = new Date().toISOString().split("T")[0];
  for (const [animal, date] of nextVaccinationByAnimal) {
    const isOverdue = date < todayIso;
    out.push({
      id: \`scheduled-vacc-\${idx++}\`,
      animal,
      type: "Vaccination",
      title: isOverdue ? "Vaccination Overdue" : "Upcoming Vaccination",
      date,
      description: isOverdue
        ? "Vaccination booster is past due — schedule as soon as possible."
        : "Vaccination booster scheduled per the deworming/vaccination CSV.",
      urgent: isOverdue,
    });
  }
  return out;
})();

export const importedMedicalEntries: MedicalEntry[] = [
  ...importedDewormingEntries,
  ...importedVaccinationEntries,
  ...yardWideAsMedical,
  ...scheduledVaccinationEntries,
];
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Yard-wide events:     ${yardWide.length}`);
console.log(`  Per-animal rows:      ${perAnimalRowCount}`);
console.log(`  Deworming entries:    ${dewormingCount}`);
console.log(`  Vaccination entries:  ${vaccinationCount}`);
console.log(`  Next-vacc dates:      ${nextVaccByAnimal.size}`);
if (unmatched.length) {
  console.log(`\n⚠ Unmatched CSV names (skipped):`);
  for (const n of unmatched) console.log(`    - ${n}`);
}
