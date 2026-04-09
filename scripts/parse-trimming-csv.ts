/**
 * Parses src/lib/data/donkey-trimming-notes.csv into:
 *   1. CareVisit[] (hoof trims) — feeds the existing hoof-dental tracking system
 *   2. TrimProfile[] (durable per-donkey trim instructions: protocols, pre-trim
 *      treatment, squish pads, recent notes)
 *
 * Writes src/lib/trimming-data.ts.
 *
 * Run: npx tsx scripts/parse-trimming-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { animals } from "../src/lib/animals";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "donkey-trimming-notes.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "trimming-data.ts");

// CSV name → app name overrides where fuzzy matching fails
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

// CSV row parser (handles quoted fields)
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

// Date normalizer: m/d/yy or m/d/yyyy → YYYY-MM-DD. Returns null for year-less dates.
function normalizeDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
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

// Extract dated trim entries from a free-text history string.
// Strategy: find every M/D/YY(YY) date, capture the text up to the next date as the note.
function extractTrims(
  history: string
): Array<{ date: string; note: string }> {
  if (!history?.trim()) return [];
  const trims: Array<{ date: string; note: string }> = [];

  // Find all date positions
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
    // Note text = from end of date to start of next date
    const noteStart = cur.index + cur.raw.length;
    const noteEnd = next ? next.index : history.length;
    let note = history.slice(noteStart, noteEnd).trim();
    // Strip leading punctuation/whitespace
    note = note.replace(/^[\s,;:.\-–—]+/, "").replace(/[\s,;]+$/, "");
    if (note.length > 200) note = note.slice(0, 197) + "...";
    if (!note) note = "Hoof trim.";
    trims.push({ date: cur.iso, note });
  }

  return trims;
}

// ── Main ──
const csv = readFileSync(CSV_PATH, "utf-8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);

const visits: string[] = [];
const profiles: string[] = [];
const unmatched: string[] = [];
const skippedYearless: string[] = [];

let visitCount = 0;
let visitId = 1;

// Skip the two header rows
for (let i = 2; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const csvName = cols[0]?.trim();
  if (!csvName) continue;

  const animal = resolveAnimal(csvName);
  if (!animal) {
    unmatched.push(csvName);
    continue;
  }

  // Column layout (per header row):
  //  0=Name, 1=Herd, 2=Gender, 3=Size, 4=Color, 5=Adopted, 6=Avid#, 7=Birth Date,
  //  8=Origin, 9=Notes, 10=Special Needs, 11=Current Vacc, 12=Vacc History,
  //  13=Dewormed-Quest+, 14=Dewormed-Iver, 15=Last Trim, 16=Training Date,
  //  17=Pre-Trim Treatment, 18=Notes on Trims, 19=Squish pads,
  //  20=Trimming Protocols, 21=Trim History, 22=Training Notes
  const lastTrim = cols[15] || "";
  const preTrimTreatment = (cols[17] || "").trim();
  const notesOnTrims = (cols[18] || "").trim();
  const squishPads = (cols[19] || "").trim();
  const protocols = (cols[20] || "").trim();
  const trimHistory = cols[21] || "";

  // Detect year-less single dates in lastTrim or trimHistory
  const yearlessRegex = /(?:^|[\s,;])(\d{1,2}\/\d{1,2})(?![\/\d])/g;
  const yearlessHits = `${lastTrim} ${trimHistory}`.match(yearlessRegex);
  if (yearlessHits && yearlessHits.length > 0) {
    skippedYearless.push(`${animal}: ${yearlessHits.map(s => s.trim()).join(", ")}`);
  }

  // Build CareVisit entries from the trim history
  const trims = extractTrims(trimHistory);

  // If no trim history but Last Trim has a date, use that
  if (trims.length === 0 && lastTrim) {
    const iso = normalizeDate(lastTrim.trim());
    if (iso) trims.push({ date: iso, note: notesOnTrims || "Hoof trim." });
  }

  for (const trim of trims) {
    visits.push(
      `  v(${JSON.stringify(animal)}, ${JSON.stringify(trim.date)}, ${JSON.stringify(trim.note)})`
    );
    visitCount++;
    visitId++;
  }

  // Build per-donkey trim profile if there's any durable info
  if (preTrimTreatment || protocols || squishPads || notesOnTrims) {
    profiles.push(
      `  [${JSON.stringify(animal)}, {\n` +
      `    preTrimTreatment: ${JSON.stringify(preTrimTreatment)},\n` +
      `    protocols: ${JSON.stringify(protocols)},\n` +
      `    squishPads: ${JSON.stringify(squishPads)},\n` +
      `    recentNotes: ${JSON.stringify(notesOnTrims)},\n` +
      `  }]`
    );
  }
}

const out = `// AUTO-GENERATED by scripts/parse-trimming-csv.ts
// Source: src/lib/data/donkey-trimming-notes.csv
// Do not edit by hand — re-run the parser instead.

import type { CareVisit } from "./hoof-dental-data";

export interface TrimProfile {
  preTrimTreatment: string;
  protocols: string;
  squishPads: string;
  recentNotes: string;
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
console.log(`  Hoof visits parsed: ${visitCount}`);
console.log(`  Trim profiles:      ${profiles.length}`);
if (unmatched.length) {
  console.log(`\n⚠ Unmatched CSV names (skipped):`);
  for (const n of unmatched) console.log(`    - ${n}`);
}
if (skippedYearless.length) {
  console.log(`\n⚠ Year-less dates in history (kept the entries that had years, skipped these):`);
  for (const n of skippedYearless.slice(0, 20)) console.log(`    - ${n}`);
  if (skippedYearless.length > 20) console.log(`    ... and ${skippedYearless.length - 20} more`);
}
