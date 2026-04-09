/**
 * Parses src/lib/data/power-pack-doses.csv into:
 *   1. MedicalEntry[] (Deworming) — one entry per actual dose given
 *   2. dewormingDosages: Map<animal, DosageProfile> — per-donkey weight category + dose
 *
 * The CSV has 6 sub-tables, each preceded by a header row of dates.
 * Sections without a date header (Pink, Seniors, Spa) have a single date in col[2].
 *
 * Run: npx tsx scripts/parse-power-pack-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { animals } from "../src/lib/animals";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "power-pack-doses.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "power-pack-data.ts");

const NAME_OVERRIDES: Record<string, string> = {
  "NELLY BELLE": "Nelley",
  "PRINCESS": "Princes",
  "SOPHIE": "Sofie",
  "JEMMA": "Jemma",
  "SERAPHINA": "Saraphina",
  "SARAPHINA": "Saraphina",
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
  "MRS. TRUMAN": "Mrs. Truman",
};

const appNames = new Set(animals.map((a) => a.name));

function resolveAnimal(csvName: string): string | null {
  const upper = csvName.trim().toUpperCase();
  if (NAME_OVERRIDES[upper]) return NAME_OVERRIDES[upper];

  const titled = csvName
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (appNames.has(titled)) return titled;

  const stripped = csvName.replace(/\([^)]*\)/g, "").trim();
  if (stripped !== csvName && stripped.length > 0) {
    return resolveAnimal(stripped);
  }
  return null;
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

// ── Types for output ──
interface ParsedDose {
  animal: string;
  date: string;
  drug: "Fenbendazole" | "Pyrantel" | "Ivermectin";
  delivery?: "grain" | "cookie";
  doubleDose?: boolean;
  context?: string; // e.g. "Power Pack day 3/5"
}

interface DosageProfile {
  category: string; // e.g. "small adults", "Large baby cookie"
  doses: number;
  doseGrams: number;
}

const doses: ParsedDose[] = [];
const dosageProfiles: Map<string, DosageProfile> = new Map();
const unmatched: string[] = [];
const undated: string[] = [];

// ── Walk the CSV ──
const csv = readFileSync(CSV_PATH, "utf-8");
const lines = csv.split(/\r?\n/);

// Current section's date header (columns 2..N)
let currentHeader: string[] = [];

for (const rawLine of lines) {
  if (!rawLine.trim()) {
    currentHeader = [];
    continue;
  }
  const cols = parseCSVLine(rawLine);
  // Empty separator row (all commas) — reset section
  if (cols.every((c) => !c.trim())) {
    currentHeader = [];
    continue;
  }
  const name = cols[0]?.trim();

  // Detect a header row: col[0] empty, col[2] is a date
  if (!name && cols[2] && normalizeDate(cols[2].trim())) {
    currentHeader = cols.map((c) => normalizeDate(c.trim()) || "");
    continue;
  }

  if (!name) continue;

  const animal = resolveAnimal(name);
  if (!animal) {
    unmatched.push(name);
    continue;
  }

  // Detect dosage profile in trailing columns
  // Patterns:
  //   Section 1: cols[10]=category, cols[11]=doses, cols[12]=grams
  //   Section 2 (single inline): cols[11]=category, cols[12]=doses, cols[13]=grams
  //   Sections 3,4: cols[10]=category, cols[11]=doses, cols[12]=grams
  for (const startCol of [10, 11]) {
    const cat = cols[startCol]?.trim();
    const doseCount = Number(cols[startCol + 1]);
    const grams = Number(cols[startCol + 2]);
    if (cat && !isNaN(doseCount) && !isNaN(grams) && doseCount > 0) {
      dosageProfiles.set(animal, { category: cat, doses: doseCount, doseGrams: grams });
      break;
    }
  }

  if (currentHeader.length > 0) {
    // Section with date header: each X/Xgrain/2X cell is a dose
    for (let i = 2; i < currentHeader.length; i++) {
      const date = currentHeader[i];
      if (!date) continue;
      const cell = cols[i]?.trim() || "";
      if (!cell) continue;

      // Determine drug for this column
      // First 5 date cols of a power-pack section are Fenbendazole; later cols are
      // single-dose drugs labeled by their cell content
      const lower = cell.toLowerCase();
      let drug: ParsedDose["drug"] | null = null;
      let context: string | undefined;
      let doubleDose = false;
      let delivery: "grain" | "cookie" | undefined;

      if (lower.includes("pyrantel")) {
        drug = "Pyrantel";
      } else if (lower.includes("ivermectin")) {
        drug = "Ivermectin";
      } else if (lower === "x" || lower === "xgrain" || lower === "2x") {
        // Power pack day — figure out which day this is
        drug = "Fenbendazole";
        // Count which power-pack day this column is (1-indexed across the 5-day span)
        let dayNum = 0;
        let totalPackDays = 0;
        for (let j = 2; j < currentHeader.length; j++) {
          const headerDate = currentHeader[j];
          if (!headerDate) continue;
          // Power-pack days are consecutive and don't include single-dose drugs in their cells
          // Treat any cell that's X/Xgrain/2X as part of the pack
          const cj = (cols[j]?.trim() || "").toLowerCase();
          if (cj === "x" || cj === "xgrain" || cj === "2x" || cj === "") {
            // Heuristic: also check that the corresponding column for OTHER rows
            // doesn't contain pyrantel/ivermectin. We approximate by using header position.
            totalPackDays++;
            if (j === i) dayNum = totalPackDays;
          } else {
            break; // hit a single-dose column; stop counting
          }
        }
        if (dayNum > 0 && totalPackDays > 0) {
          context = `Fenbendazole 5-day power pack — day ${dayNum}/${totalPackDays}`;
        }
        if (lower === "xgrain") delivery = "grain";
        if (lower === "2x") doubleDose = true;
      }

      if (!drug) continue;

      doses.push({ animal, date, drug, delivery, doubleDose, context });
    }
  } else {
    // No date header — the date (if any) is in col[2], description in col[3]
    const dateRaw = cols[2]?.trim();
    const desc = cols[3]?.trim() || "";

    if (!dateRaw) {
      undated.push(`${animal} (${desc || "no date"})`);
      continue;
    }

    const date = normalizeDate(dateRaw);
    if (!date) {
      undated.push(`${animal} (${dateRaw})`);
      continue;
    }

    // Determine drug from description
    const lower = desc.toLowerCase();
    let drug: ParsedDose["drug"] | null = null;
    if (lower.includes("pyrantel")) drug = "Pyrantel";
    else if (lower.includes("ivermectin")) drug = "Ivermectin";
    else if (lower.includes("fenbendazole")) drug = "Fenbendazole";

    if (drug) doses.push({ animal, date, drug });
  }
}

// ── Dedupe within power-pack data itself ──
// The CSV has Angel/Leilani in two sections; this prevents emitting duplicate
// pyrantel/ivermectin entries on the same date.
const seenKeys = new Set<string>();
const dedupedDoses: ParsedDose[] = [];
for (const d of doses) {
  const key = `${d.animal}|${d.drug}|${d.date}`;
  if (seenKeys.has(key)) continue;
  seenKeys.add(key);
  dedupedDoses.push(d);
}
doses.length = 0;
doses.push(...dedupedDoses);

// ── Emit TS ──
const doseLines = doses.map((d) => {
  const titleParts: string[] = [d.drug];
  if (d.context) titleParts.push(d.context);
  const title = d.context ? d.context : `${d.drug} single dose`;
  const descParts: string[] = [`${d.drug} dose administered.`];
  if (d.delivery === "grain") descParts.push("Delivered in grain.");
  if (d.doubleDose) descParts.push("Double dose given.");
  const description = descParts.join(" ");
  return `  rec(${JSON.stringify(d.animal)}, ${JSON.stringify(title)}, ${JSON.stringify(d.date)}, ${JSON.stringify(description)}, ${JSON.stringify(d.drug)})`;
});

const profileLines = Array.from(dosageProfiles.entries()).map(([animal, p]) => {
  return `  [${JSON.stringify(animal)}, { category: ${JSON.stringify(p.category)}, doses: ${p.doses}, doseGrams: ${p.doseGrams} }]`;
});

const out = `// AUTO-GENERATED by scripts/parse-power-pack-csv.ts
// Source: src/lib/data/power-pack-doses.csv
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry } from "./medical-data";

export interface DewormingDosage {
  category: string;
  doses: number;
  doseGrams: number;
}

let nextId = 50000;
function rec(
  animal: string,
  title: string,
  date: string,
  description: string,
  drug: string
): MedicalEntry & { drug: string } {
  return {
    id: \`med-pp-\${nextId++}\`,
    animal,
    type: "Deworming",
    title,
    date,
    description,
    urgent: false,
    drug,
  };
}

// Each entry includes the drug name so the deduper can match by (animal, drug, date)
export const powerPackEntries: (MedicalEntry & { drug: string })[] = [
${doseLines.join(",\n")},
];

export const dewormingDosages: Map<string, DewormingDosage> = new Map([
${profileLines.join(",\n")},
]);

export function getDewormingDosage(animalName: string): DewormingDosage | null {
  return dewormingDosages.get(animalName) ?? null;
}
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Dose entries:     ${doses.length}`);
console.log(`  Dosage profiles:  ${dosageProfiles.size}`);
if (unmatched.length) {
  console.log(`\n⚠ Unmatched CSV names:`);
  for (const n of unmatched) console.log(`    - ${n}`);
}
if (undated.length) {
  console.log(`\n⚠ Skipped (no date):`);
  for (const n of undated) console.log(`    - ${n}`);
}
