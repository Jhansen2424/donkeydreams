/**
 * Parses src/lib/data/donkey-trimming-notes.csv into:
 *   1. CareVisit[] (hoof trims) — feeds the existing hoof-dental tracking system
 *   2. TrimProfile[] (durable per-donkey trim instructions: protocols, pre-trim
 *      treatment, squish pads, recent notes, last trim, training date/notes)
 *
 * Writes src/lib/trimming-data.ts.
 *
 * CSV columns (0-indexed):
 *    0  Name
 *    1  Mom/baby            (ignored — derived from adoption CSV)
 *    2  Special Needs       (ignored — derived from adoption CSV)
 *    3  Seniors             (ignored)
 *    4  Under 3 yrs         (ignored)
 *    5  Bonded Pair         (ignored)
 *    6  Current Vaccinations (ignored — vaccines come from a separate CSV)
 *    7  Vaccination History  (ignored)
 *    8  Dewormed-Quest Plus  (ignored)
 *    9  Dewormed-Ivermectin  (ignored)
 *   10  Last Trim
 *   11  Training Date
 *   12  Pre-Trim Treatment
 *   13  Notes on Trims
 *   14  Squish pads
 *   15  Trimming Protocols
 *   16  Trim History
 *   17  Training Notes
 *
 * Run: npx tsx scripts/parse-trimming-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { animals } from "../src/lib/animals";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "donkey-trimming-notes.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "trimming-data.ts");

// CSV name → app name overrides where fuzzy matching fails.
const NAME_OVERRIDES: Record<string, string> = {
  "NELLY BELLE": "Nelley",
  "PRINCESS": "Princes",
  "SOPHIE": "Sofie",
  "SERAPHINA": "Saraphina",
  "ELENORA": "Elanora",
  "DUSK": "Dusky",
  "RAINIER": "Raineer",
  "MAKUAHINE HAU": "Maku",
  "ROSIE": "Rosey",
  "ISABELLA": "Izabelle",
  "KAI-YA": "Kayla",
  "PETE": "Petey",
  "VANELLOPE": "Venelope",
  "CLOUD": "Cloudy",
  "JACK JACK": "Jack Jack",
  "DANNY BOY": "Danny Boy",
  "LELANI": "Leilani",
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

  // Strip parenthetical, retry
  const stripped = csvName.replace(/\([^)]*\)/g, "").trim();
  if (stripped !== csvName && stripped.length > 0) {
    return resolveAnimal(stripped);
  }
  return null;
}

// Multi-line aware CSV parser: returns an array of rows, where each row is an
// array of fields. Handles quoted fields containing literal newlines (e.g. Bob's
// trim history wraps to a second physical line in the CSV).
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
        // End of physical line. If the next char is the other half of \r\n, skip it.
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        // Drop blank rows
        if (row.length > 1 || row[0].trim() !== "") rows.push(row);
        row = [];
      } else {
        cur += c;
      }
    }
  }
  // Flush trailing field/row
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    if (row.length > 1 || row[0].trim() !== "") rows.push(row);
  }
  return rows;
}

// Date normalizer: m/d/yy or m/d/yyyy → YYYY-MM-DD. Returns null otherwise.
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

// Pull just a leading date out of strings like "3/9/26 special leg" — Last Trim
// occasionally has trailing notes attached.
function extractLeadingDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  return m ? normalizeDate(m[1]) : null;
}

// Extract dated trim entries from a free-text history string. Strategy: find
// every M/D/YY(YY) date, capture the text up to the next date as the note.
function extractTrims(
  history: string
): Array<{ date: string; note: string }> {
  if (!history?.trim()) return [];
  const trims: Array<{ date: string; note: string }> = [];

  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
  const matches: Array<{ index: number; raw: string; iso: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = dateRegex.exec(history)) !== null) {
    const iso = normalizeDate(m[1]);
    if (iso) matches.push({ index: m.index, raw: m[1], iso });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const noteStart = cur.index + cur.raw.length;
    const noteEnd = next ? next.index : history.length;
    let note = history.slice(noteStart, noteEnd).trim();
    note = note.replace(/^[\s,;:.\-–—]+/, "").replace(/[\s,;]+$/, "");
    if (note.length > 200) note = note.slice(0, 197) + "...";
    if (!note) note = "Hoof trim.";
    trims.push({ date: cur.iso, note });
  }

  // Dedupe by date — same date appearing twice keeps the first (most recent in
  // CSV order, which is reverse-chronological).
  const seen = new Set<string>();
  return trims.filter((t) => {
    if (seen.has(t.date)) return false;
    seen.add(t.date);
    return true;
  });
}

// ── Main ──
const csv = readFileSync(CSV_PATH, "utf-8");
const rows = parseCSV(csv);

const visits: string[] = [];
const profiles: string[] = [];
const unmatched: string[] = [];

let visitCount = 0;
let visitId = 1;
let profilesWithLastTrim = 0;
let profilesWithTraining = 0;

// Skip the two header rows
for (let i = 2; i < rows.length; i++) {
  const cols = rows[i];
  const csvName = cols[0]?.trim();
  if (!csvName) continue;

  // Skip the totals footer row (e.g. ",42,13,11,25,..." with no name)
  if (/^\d+$/.test(csvName)) continue;

  const animal = resolveAnimal(csvName);
  if (!animal) {
    unmatched.push(csvName);
    continue;
  }

  const lastTrimRaw = (cols[10] || "").trim();
  const trainingDateRaw = (cols[11] || "").trim();
  const preTrimTreatment = (cols[12] || "").trim();
  const notesOnTrims = (cols[13] || "").trim();
  const squishPads = (cols[14] || "").trim();
  const protocols = (cols[15] || "").trim();
  const trimHistory = (cols[16] || "").trim();
  const trainingNotes = (cols[17] || "").trim();

  const lastTrimISO = extractLeadingDate(lastTrimRaw);
  const trainingDateISO = extractLeadingDate(trainingDateRaw);

  // Build CareVisit entries from the trim history
  const trims = extractTrims(trimHistory);

  // If no parseable history but Last Trim has a date, seed one entry from it
  if (trims.length === 0 && lastTrimISO) {
    trims.push({ date: lastTrimISO, note: notesOnTrims || "Hoof trim." });
  }

  for (const trim of trims) {
    visits.push(
      `  v(${JSON.stringify(animal)}, ${JSON.stringify(trim.date)}, ${JSON.stringify(trim.note)})`
    );
    visitCount++;
    visitId++;
  }

  // Build per-donkey trim profile if there's any durable info
  const hasProfileData =
    preTrimTreatment ||
    protocols ||
    squishPads ||
    notesOnTrims ||
    trainingNotes ||
    lastTrimISO ||
    trainingDateISO;

  if (hasProfileData) {
    if (lastTrimISO) profilesWithLastTrim++;
    if (trainingDateISO || trainingNotes) profilesWithTraining++;
    profiles.push(
      `  [${JSON.stringify(animal)}, {\n` +
        `    lastTrim: ${JSON.stringify(lastTrimISO)},\n` +
        `    preTrimTreatment: ${JSON.stringify(preTrimTreatment)},\n` +
        `    protocols: ${JSON.stringify(protocols)},\n` +
        `    squishPads: ${JSON.stringify(squishPads)},\n` +
        `    recentNotes: ${JSON.stringify(notesOnTrims)},\n` +
        `    trainingDate: ${JSON.stringify(trainingDateISO)},\n` +
        `    trainingNotes: ${JSON.stringify(trainingNotes)},\n` +
        `  }]`
    );
  }
}

const out = `// AUTO-GENERATED by scripts/parse-trimming-csv.ts
// Source: src/lib/data/donkey-trimming-notes.csv
// Do not edit by hand — re-run the parser instead.

import type { CareVisit } from "./hoof-dental-data";

export interface TrimProfile {
  /** ISO date of the most recent trim, per the CSV's "Last Trim" column. */
  lastTrim: string | null;
  /** Sedation / pre-meds / valerian root protocols. */
  preTrimTreatment: string;
  /** Per-donkey trimming approach (sling, halter, who's nearby, etc.). */
  protocols: string;
  /** Squish pad usage notes. */
  squishPads: string;
  /** Most recent free-text notes from the trim session. */
  recentNotes: string;
  /** ISO date of the last training/desensitization session. */
  trainingDate: string | null;
  /** Free-text notes on training progress (lifting feet, building trust, etc.). */
  trainingNotes: string;
}

let nextId = 1;
function v(animal: string, date: string, notes: string): CareVisit {
  return {
    id: \`trim-import-\${nextId++}\`,
    animal,
    type: "hoof",
    date,
    provider: "Donkey Dreams team",
    notes,
  };
}

export const importedHoofVisits: CareVisit[] = [
${visits.join(",\n")},
];

export const trimProfiles: Map<string, TrimProfile> = new Map([
${profiles.join(",\n")},
]);

export function getTrimProfile(animalName: string): TrimProfile | null {
  return trimProfiles.get(animalName) ?? null;
}
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Hoof visits parsed:        ${visitCount}`);
console.log(`  Trim profiles:             ${profiles.length}`);
console.log(`  ... with Last Trim date:   ${profilesWithLastTrim}`);
console.log(`  ... with training info:    ${profilesWithTraining}`);
if (unmatched.length) {
  console.log(`\n⚠ Unmatched CSV names (skipped):`);
  for (const n of unmatched) console.log(`    - ${n}`);
}
