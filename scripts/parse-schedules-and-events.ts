/**
 * Parses three CSVs:
 *   - src/lib/data/angels-schedule.csv     → future-dated scheduled doses + weights
 *   - src/lib/data/pegasus-schedule.csv    → future-dated scheduled doses + weights
 *   - src/lib/data/brave-events.csv        → actual events (power packs, ivermectin, fecal tests, 9/8 TBD)
 *
 * Outputs src/lib/scheduled-and-events-data.ts with:
 *   - scheduledDewormingEntries: MedicalEntry[] (future only — past dates skipped, see Option B)
 *   - braveActualEntries: MedicalEntry[] (all rows; power packs expanded to 5 days)
 *   - donkeyWeights: Map<animal, { lbs, kg }>
 *
 * Run: npx tsx scripts/parse-schedules-and-events.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { animals } from "../src/lib/animals";

const DATA_DIR = join(__dirname, "..", "src", "lib", "data");
const OUT_PATH = join(__dirname, "..", "src", "lib", "scheduled-and-events-data.ts");

// Today's cutoff for "future" entries. Anything strictly after this date is kept.
// Reading from system clock so this stays accurate when re-run.
const TODAY = new Date().toISOString().split("T")[0];

const NAME_OVERRIDES: Record<string, string> = {
  "JACK JACK": "Jack Jack",
  "DANNY BOY": "Danny Boy",
  "ISABELLA (IZZY)": "Izabelle",
  "KAI-YA": "Kayla",
  "ROSIE": "Rosey",
  "SARAPHINA": "Saraphina",
  "ELENORA": "Elanora",
  "LEILANI": "Leilani",
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

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface Dose {
  animal: string;
  type: "Deworming" | "Fecal Test";
  title: string;
  date: string;
  description: string;
}

const scheduled: Dose[] = [];
const braveActuals: Dose[] = [];
const weights: Map<string, { lbs: number; kg: number }> = new Map();
const unmatched: string[] = [];
let skippedPastSchedule = 0;

function recordWeight(animal: string, lbs: number, kg: number) {
  if (!lbs || isNaN(lbs)) return;
  // Keep the last (most recent) weight seen — CSVs are processed in order
  weights.set(animal, { lbs, kg: kg || lbs * 0.453592 });
}

function canonDrug(raw: string): string | null {
  const t = raw.toLowerCase();
  // Order matters — more specific patterns first
  if (t.includes("moxidectin or pyrantel")) return "Moxidectin or Pyrantel";
  if (t.includes("fenbendazole")) return "Fenbendazole";
  if (t.includes("pyrantel")) return "Pyrantel Pamoate";
  if (t.includes("moxidectin")) return "Moxidectin";
  if (t.includes("ivermectin")) return "Ivermectin";
  if (t.includes("fecal egg count")) return "Fecal Egg Count";
  return null;
}

// ── Parse Angels & Pegasus schedule CSVs ──
// Columns: Name,Next Deworming Date,Dewormer,Weight (lbs),Weight (kg),Notes,Dosage (g/day),Total Dosage (g)
function parseScheduleCSV(filename: string) {
  const lines = readFileSync(join(DATA_DIR, filename), "utf-8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const csvName = cols[0]?.trim();
    if (!csvName) continue;

    const animal = resolveAnimal(csvName);
    if (!animal) {
      unmatched.push(`${filename}: ${csvName}`);
      continue;
    }

    const date = normalizeDate(cols[1]?.trim() || "");
    if (!date) continue;

    const drug = canonDrug(cols[2] || "");
    if (!drug) continue;

    const lbs = Number(cols[3]);
    const kg = Number(cols[4]);
    recordWeight(animal, lbs, kg);

    // Option B — only keep future dates (strictly after today)
    if (date <= TODAY) {
      skippedPastSchedule++;
      continue;
    }

    const notes = cols[5]?.trim() || "";
    const dosageGPerDay = cols[6]?.trim() || "";
    const totalG = cols[7]?.trim() || "";

    const isPowerPack = notes.toLowerCase().includes("power pack");

    if (isPowerPack) {
      // Expand 5-day fenbendazole power pack
      for (let day = 1; day <= 5; day++) {
        scheduled.push({
          animal,
          type: "Deworming",
          title: `${drug} 5-day power pack — day ${day}/5 (scheduled)`,
          date: addDays(date, day - 1),
          description: `Scheduled. ${dosageGPerDay}g/day, total ${totalG}g course. Weight ${lbs} lbs.`,
        });
      }
    } else {
      scheduled.push({
        animal,
        type: "Deworming",
        title: `${drug} single dose (scheduled)`,
        date,
        description: `Scheduled. ${dosageGPerDay}g, ${notes}. Weight ${lbs} lbs.`,
      });
    }
  }
}

// ── Parse Brave events CSV (actual events) ──
// Columns: Date,Donkey Name,Weight (lbs),Dewormer/Test,Dosage,Notes
function parseBraveEventsCSV() {
  const lines = readFileSync(join(DATA_DIR, "brave-events.csv"), "utf-8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const date = normalizeDate(cols[0]?.trim() || "");
    if (!date) continue;

    const csvName = cols[1]?.trim();
    if (!csvName) continue;
    const animal = resolveAnimal(csvName);
    if (!animal) {
      unmatched.push(`brave-events.csv: ${csvName}`);
      continue;
    }

    const lbs = Number(cols[2]);
    recordWeight(animal, lbs, lbs * 0.453592);

    const drugRaw = cols[3]?.trim() || "";
    const dosage = cols[4]?.trim() || "";
    const notes = cols[5]?.trim() || "";
    const drug = canonDrug(drugRaw);
    if (!drug) continue;

    if (drug === "Fecal Egg Count") {
      braveActuals.push({
        animal,
        type: "Fecal Test",
        title: "Fecal Egg Count",
        date,
        description: `${notes || "Sample collection"}. Weight ${lbs} lbs.`,
      });
      continue;
    }

    // "Day 1 of 5" → expand 5-day power pack
    if (notes.toLowerCase().includes("day 1 of 5")) {
      for (let day = 1; day <= 5; day++) {
        braveActuals.push({
          animal,
          type: "Deworming",
          title: `${drug} 5-day power pack — day ${day}/5`,
          date: addDays(date, day - 1),
          description: `${dosage}. Weight ${lbs} lbs.`,
        });
      }
      continue;
    }

    // "Choose one (single dose)" — Moxidectin OR Pyrantel TBD
    if (drug === "Moxidectin or Pyrantel") {
      braveActuals.push({
        animal,
        type: "Deworming",
        title: "Moxidectin or Pyrantel — drug TBD",
        date,
        description: `Choose one (single dose). ${dosage}. Weight ${lbs} lbs.`,
      });
      continue;
    }

    // Plain single dose
    braveActuals.push({
      animal,
      type: "Deworming",
      title: `${drug} single dose`,
      date,
      description: `${dosage}. Weight ${lbs} lbs.`,
    });
  }
}

// ── Run all parsers ──
parseScheduleCSV("angels-schedule.csv");
parseScheduleCSV("pegasus-schedule.csv");
parseBraveEventsCSV();

// ── Emit TS ──
function emitEntry(d: Dose, idPrefix: string, idx: number): string {
  return `  { id: ${JSON.stringify(`${idPrefix}-${idx}`)}, animal: ${JSON.stringify(d.animal)}, type: ${JSON.stringify(d.type)}, title: ${JSON.stringify(d.title)}, date: ${JSON.stringify(d.date)}, description: ${JSON.stringify(d.description)}, urgent: false }`;
}

const scheduledLines = scheduled.map((d, i) => emitEntry(d, "med-sched", i));
const braveLines = braveActuals.map((d, i) => emitEntry(d, "med-brave", i));
const weightLines = Array.from(weights.entries()).map(
  ([animal, w]) =>
    `  [${JSON.stringify(animal)}, { lbs: ${w.lbs}, kg: ${w.kg.toFixed(2)} }]`
);

const out = `// AUTO-GENERATED by scripts/parse-schedules-and-events.ts
// Sources: angels-schedule.csv, pegasus-schedule.csv, brave-events.csv
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry } from "./medical-data";

// Future-dated scheduled doses from Angels & Pegasus deworming schedules.
// Past-dated rows are intentionally skipped — actual administered doses live
// in deworming-vaccination-data and power-pack-data instead.
export const scheduledDewormingEntries: MedicalEntry[] = [${
  scheduledLines.length ? "\n" + scheduledLines.join(",\n") + ",\n" : ""
}];

// Actual events from the Brave events CSV: power packs (5-day expanded),
// ivermectin singles, fecal egg count tasks, and the 9/8 "Moxidectin or Pyrantel"
// TBD entries.
export const braveActualEntries: MedicalEntry[] = [${
  braveLines.length ? "\n" + braveLines.join(",\n") + ",\n" : ""
}];

export interface DonkeyWeight {
  lbs: number;
  kg: number;
}

// Per-donkey weight from CSVs (most recent value seen).
export const donkeyWeights: Map<string, DonkeyWeight> = new Map([${
  weightLines.length ? "\n" + weightLines.join(",\n") + ",\n" : ""
}]);

export function getDonkeyWeight(animalName: string): DonkeyWeight | null {
  return donkeyWeights.get(animalName) ?? null;
}
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Scheduled (future) entries:  ${scheduled.length}`);
console.log(`  Brave actual entries:        ${braveActuals.length}`);
console.log(`  Donkey weights:              ${weights.size}`);
console.log(`  Skipped past-dated schedule rows: ${skippedPastSchedule}`);
if (unmatched.length) {
  console.log(`\n⚠ Unmatched CSV names:`);
  for (const n of unmatched) console.log(`    - ${n}`);
}
