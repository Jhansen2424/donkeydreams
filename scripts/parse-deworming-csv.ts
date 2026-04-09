/**
 * Parses src/lib/data/deworming-vaccination.csv into individual MedicalEntry
 * records (one per dose / per shot) and writes src/lib/deworming-vaccination-data.ts.
 *
 * Run: npx tsx scripts/parse-deworming-csv.ts
 *
 * Re-run any time the CSV is updated. Output is committed.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { animals } from "../src/lib/animals";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "deworming-vaccination.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "deworming-vaccination-data.ts");

// ── CSV name → app name overrides (where fuzzy match would fail) ──
const NAME_OVERRIDES: Record<string, string> = {
  "NELLY BELLE": "Nelley",
  "PRINCESS": "Princes",
  "SOPHIE": "Sofie",
  // Jemma is a baby donkey (Sophie's surrogate baby), distinct from Legacy elder Gemma
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

  // Try title-case direct match
  const titled = csvName
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (appNames.has(titled)) return titled;
  if (appNameLower.has(csvName.trim().toLowerCase())) {
    return appNameLower.get(csvName.trim().toLowerCase())!;
  }
  // Strip parenthetical, retry
  const stripped = csvName.replace(/\([^)]*\)/g, "").trim();
  if (stripped !== csvName) return resolveAnimal(stripped);
  return null;
}

// ── CSV row parser (handles quoted fields) ──
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

// ── Date normalizer: m/d/yy or m/d/yyyy → YYYY-MM-DD ──
function normalizeDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) year = "20" + year;
  // Sanity check
  const mo = Number(month);
  const da = Number(day);
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  return `${year}-${month}-${day}`;
}

// ── Tokenize a Deworming History string into (drug, date) pairs ──
const DRUGS = [
  "Fenbendazole",
  "Pyrantel Pamoate",
  "Pyrantel",
  "Tri-wormer",
  "Triwormer",
  "Ivermectin",
  "Moxidectin",
];

function extractDoses(history: string): Array<{ drug: string; date: string }> {
  if (!history?.trim()) return [];
  const doses: Array<{ drug: string; date: string }> = [];

  // Pattern: <drug name> <date>
  // Drug names case-insensitive; dates m/d/yy or m/d/yyyy
  const drugAlt = DRUGS.map((d) => d.replace("-", "[- ]?")).join("|");
  const re = new RegExp(`(${drugAlt})\\s*(\\d{1,2}/\\d{1,2}/\\d{2,4})`, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(history)) !== null) {
    const rawDrug = match[1];
    const date = normalizeDate(match[2]);
    if (!date) continue;
    // Canonicalize drug name
    const lower = rawDrug.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    let drug = "Other";
    if (lower.includes("fenbendazole")) drug = "Fenbendazole";
    else if (lower.includes("pyrantelpamoate")) drug = "Pyrantel Pamoate";
    else if (lower.includes("pyrantel")) drug = "Pyrantel";
    else if (lower.includes("triwormer")) drug = "Tri-wormer";
    else if (lower.includes("ivermectin")) drug = "Ivermectin";
    else if (lower.includes("moxidectin")) drug = "Moxidectin";
    doses.push({ drug, date });
  }
  return doses;
}

// ── Tokenize a Vaccination History string ──
// Patterns: "11/25/24 Rabies", "6 Way 11/25/24", "10/16/25 Gold 6 Way (3710082A)", etc.
function extractVaccinations(
  history: string
): Array<{ vaccine: string; date: string; lot?: string }> {
  if (!history?.trim()) return [];
  const out: Array<{ vaccine: string; date: string; lot?: string }> = [];

  // Split on commas / semicolons
  const parts = history.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const dateMatch = part.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (!dateMatch) continue;
    const date = normalizeDate(dateMatch[1]);
    if (!date) continue;

    // Extract vaccine label (everything that's not the date or lot number)
    let label = part
      .replace(dateMatch[0], "")
      .replace(/\([^)]*\)/g, "")
      .trim();
    // Clean stray punctuation
    label = label.replace(/^[-:,\s]+|[-:,\s]+$/g, "");
    if (!label) label = "Vaccination";

    const lotMatch = part.match(/\(([^)]+)\)/);
    out.push({
      vaccine: label,
      date,
      lot: lotMatch ? lotMatch[1] : undefined,
    });
  }
  return out;
}

// ── Main ──
const csv = readFileSync(CSV_PATH, "utf-8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);

const dewormingEntries: string[] = [];
const vaccinationEntries: string[] = [];
const unmatched: string[] = [];
let dewormingCount = 0;
let vaccinationCount = 0;
let nextId = 1;

// Skip header row
for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const csvName = cols[0]?.trim();
  if (!csvName || csvName.startsWith("PREV-HERD")) continue;
  if (csvName === "Name") continue; // template section header

  const animal = resolveAnimal(csvName);
  if (!animal) {
    unmatched.push(csvName);
    continue;
  }

  // Columns: 0=Name, 1=Herd, 2=DewormedDate, 3=DewormingHistory, 4=NextVacc,
  //          5=Vaccinated, 6=VaccinationHistory, 7=VaccDate, 8=NextVacc2
  const dewormingHistory = cols[3] || "";
  const vaccinationHistory = cols[6] || "";

  for (const dose of extractDoses(dewormingHistory)) {
    dewormingEntries.push(
      `  rec(${JSON.stringify(animal)}, "Deworming", ${JSON.stringify(
        `${dose.drug}`
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

const out = `// AUTO-GENERATED by scripts/parse-deworming-csv.ts
// Source: src/lib/data/deworming-vaccination.csv
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry, MedicalRecordType } from "./medical-data";

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

export const importedMedicalEntries: MedicalEntry[] = [
  ...importedDewormingEntries,
  ...importedVaccinationEntries,
];
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Deworming entries:    ${dewormingCount}`);
console.log(`  Vaccination entries:  ${vaccinationCount}`);
if (unmatched.length) {
  console.log(`\n⚠ Unmatched CSV names (skipped):`);
  for (const n of unmatched) console.log(`    - ${n}`);
}
