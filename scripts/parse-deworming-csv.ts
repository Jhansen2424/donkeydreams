/**
 * Parses the Deworming & Vaccination Checklist CSVs into
 * src/lib/deworming-vaccination-data.ts:
 *
 *   src/lib/data/deworming-vaccination.csv  (per-donkey, from
 *     scripts/xlsx-to-deworming-csv.py; the dedicated checklist sheet is the
 *     source of truth for deworming/vaccination — the adoption sheet's
 *     matching columns are older duplicates and are NOT imported)
 *       0  Name
 *       1  Herd                (ignored — adoption sheet owns herd)
 *       2  Dewormed Date       (fallback date/year for history events)
 *       3  Deworming History   ("Drug M/D/YY" runs, ";"/"," separated)
 *       4  Vaccinated          (ignored — duplicated by the history column)
 *       5  Vaccination History ("M/D/YY Vaccine (lot)" and "Vaccine M/D/YY")
 *       6  Vaccination Date    (fallback date/year for history events)
 *       7  Next Vaccination    → nextVaccinationByAnimal + scheduled entries
 *       8  Notes               → dated "Note" medical entries
 *
 *   src/lib/data/yard-wide-deworming.csv  (Date, Drug, Dose)
 *       → yardWideDewormings (dashboard widget only; per-donkey doses come
 *         from each donkey's own history, so yard-wide rows are NOT expanded
 *         into per-animal entries)
 *
 * History cells mix two shapes, split on ";" and ",":
 *   drug-first: "Fenbendazole 12/27/25", "Gold 6 Way 4/23/25 (3710082A)"
 *   date-first: "7/5/26 Prestige 5 Way (9186A0218)"
 * A chunk may run several drug-first pairs together ("IVERMECTIN 11/10/25
 * IVERMECTIN 5/5/25"). Lot numbers in parens become the entry description.
 * Future-dated events (scheduled doses/vaccines) import as-is and surface on
 * the medical dashboard's Upcoming tab.
 *
 * Run: npx tsx scripts/parse-deworming-csv.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CSV_PATH = join(__dirname, "..", "src", "lib", "data", "deworming-vaccination.csv");
const YARD_CSV_PATH = join(__dirname, "..", "src", "lib", "data", "yard-wide-deworming.csv");
const OUT_PATH = join(__dirname, "..", "src", "lib", "deworming-vaccination-data.ts");

const NAME_OVERRIDES: Record<string, string> = {
  "JACK JACK": "Jack Jack",
  "DANNY BOY": "Danny Boy",
  "ISABELLA (IZZY)": "Izabella (Izzy)",
  "SKYLA (SKYE)": "Skyla (Skye)",
  "NELLY BELLE": "Nelly Belle",
  ELENORA: "Elanora", // recurring sheet typo
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
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let year = m[3];
  if (year.length === 2) year = "20" + year;
  return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

function cleanTitle(raw: string): string {
  let t = raw
    .replace(/[.;]+/g, " ")
    .replace(/^\s*(?:and|on|the|of)\s+/i, "")
    .replace(/\s+(?:and|on|of)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/rabiies/gi, "Rabies");
  t = t.replace(/\b(\d+)\s*way\b/gi, "$1 Way");
  t = t.replace(/^i?vermectin$/i, "Ivermectin"); // "Vermectin" sheet typo
  t = t.replace(/\bGOLD\b/g, "Gold");
  t = t.replace(/\+\s*VEE\b/gi, "+ VEE");
  t = t.replace(/^5[- ]day power pack of\s+(\S+)$/i, (_, drug: string) => {
    const d = drug.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    return `${d} 5-day Power Pack`;
  });
  if (/^dewormed$/i.test(t)) t = "Deworming";
  if (t === t.toUpperCase()) {
    t = t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return t;
}

interface CareEvent {
  title: string;
  date: string;
  description: string;
}

// Pull "(9186A0218)"-style lot numbers out of a title.
function extractLot(title: string): { title: string; lot: string } {
  const m = title.match(/\(([A-Za-z0-9-]{4,})\)/);
  if (!m) return { title, lot: "" };
  return { title: title.replace(m[0], "").trim(), lot: m[1] };
}

function parseCareHistory(
  text: string,
  fallbackDate: string | null,
  defaultTitle: string
): CareEvent[] {
  const out: CareEvent[] = [];
  if (!text) return out;
  let prevTitle = "";

  for (const chunkRaw of text.replace(/\s+/g, " ").split(/[;,]/)) {
    const chunk = chunkRaw.trim();
    if (!chunk) continue;

    const dateRe = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g;
    const found: Array<{ start: number; end: number; m: number; d: number; y: string | null }> = [];
    let dm: RegExpExecArray | null;
    while ((dm = dateRe.exec(chunk)) !== null) {
      found.push({ start: dm.index, end: dm.index + dm[0].length, m: +dm[1], d: +dm[2], y: dm[3] ?? null });
    }

    if (found.length === 0) {
      // Dateless fragment — usually a trailing lot number for the previous
      // event; otherwise append it to the previous event's description.
      if (out.length > 0) {
        const { lot } = extractLot(chunk);
        const extra = lot ? `Lot ${lot}` : cleanTitle(chunk);
        if (extra) {
          const prev = out[out.length - 1];
          prev.description = prev.description ? `${prev.description} ${extra}` : extra;
        }
      }
      continue;
    }

    // Segments around the dates: s0 [d0] s1 [d1] s2 ...
    const segments: string[] = [];
    segments.push(chunk.slice(0, found[0].start));
    for (let i = 0; i < found.length; i++) {
      segments.push(chunk.slice(found[i].end, found[i + 1]?.start ?? chunk.length));
    }
    const dateFirst = segments[0].trim() === "";

    for (let i = 0; i < found.length; i++) {
      const f = found[i];
      let year = f.y;
      if (!year) {
        year = found.slice(i + 1).find((n) => n.y)?.y ?? fallbackDate?.slice(0, 4) ?? null;
        if (!year) continue;
      }
      if (year.length === 2) year = "20" + year;
      const date = `${year}-${String(f.m).padStart(2, "0")}-${String(f.d).padStart(2, "0")}`;

      // date-first chunks name the event AFTER the date; drug-first before it.
      let rawTitle = dateFirst ? segments[i + 1] : segments[i];
      // Drug-first segments starting with lowercase context ("for weight
      // concerns Dewormed 8/1/24") carry the PREVIOUS event's description.
      if (!dateFirst) {
        const ctx = rawTitle.match(/^[\s.]*((?:for|due to|because of)\s+[a-z][^A-Z]*)/);
        if (ctx && out.length > 0) {
          const prev = out[out.length - 1];
          const extra = cleanTitle(ctx[1]);
          prev.description = prev.description ? `${prev.description} ${extra}` : extra;
          rawTitle = rawTitle.slice(ctx[0].length);
        }
      }
      const { title: stripped, lot } = extractLot(rawTitle);
      let title = cleanTitle(stripped);
      let unlabeled = false;
      if (!title) title = prevTitle;
      if (!title) {
        // A date with no label anywhere near it (e.g. Raya's leading
        // "7/13/26") — keep the event rather than dropping the date.
        title = defaultTitle;
        unlabeled = true;
      }
      prevTitle = unlabeled ? prevTitle : title;

      let description = lot ? `Lot ${lot}` : "";
      if (unlabeled) description = "Unlabeled date in checklist cell.";
      // Trailing text after the last date of a drug-first chunk is context.
      if (!dateFirst && i === found.length - 1) {
        const { title: tailText, lot: tailLot } = extractLot(segments[i + 1] ?? "");
        const tail = tailLot ? `Lot ${tailLot}` : cleanTitle(tailText);
        if (tail) description = description ? `${description} ${tail}` : tail;
      }

      out.push({ title, date, description });
    }
  }

  // Drop exact repeats (same title + date) that show up across run-on chunks.
  const seen = new Set<string>();
  return out.filter((e) => {
    const key = `${e.title}|${e.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Parse per-donkey CSV ──
const csv = readFileSync(CSV_PATH, "utf-8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);

const dewormingEvents: Array<{ animal: string } & CareEvent> = [];
const vaccinationEvents: Array<{ animal: string } & CareEvent> = [];
const noteEvents: Array<{ animal: string; date: string | null; text: string }> = [];
const nextVaccinations: Array<{ animal: string; date: string }> = [];

for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const csvName = cols[0]?.trim();
  if (!csvName) continue;
  const animal = resolveName(csvName);

  const dewormedDate = normalizeDate(cols[2]?.trim() || "");
  const dewormingHistory = cols[3]?.trim() || "";
  const vaccinationHistory = cols[5]?.trim() || "";
  const vaccinationDate = normalizeDate(cols[6]?.trim() || "");
  const nextVaccination = normalizeDate(cols[7]?.trim() || "");
  const notes = cols[8]?.trim() || "";

  for (const e of parseCareHistory(dewormingHistory, dewormedDate, "Deworming")) {
    dewormingEvents.push({ animal, ...e });
  }
  for (const e of parseCareHistory(vaccinationHistory, vaccinationDate, "Vaccination")) {
    // "6 Way and Dewormed 2/22/25" — one date covering a vaccine AND a
    // deworming dose; peel the deworming off into its own entry.
    let title = e.title;
    const combo = title.match(/^(.*?)\s+and\s+Deworm(?:ed|ing)$/i);
    if (combo) {
      dewormingEvents.push({ animal, title: "Deworming", date: e.date, description: e.description });
      title = cleanTitle(combo[1]);
      if (!title) continue;
    }
    // "6 Way Booster and Rabies" — two vaccines, one date → one entry each.
    for (const part of title.split(/\s+and\s+/i)) {
      const t = cleanTitle(part);
      if (t) vaccinationEvents.push({ animal, title: t, date: e.date, description: e.description });
    }
  }
  if (nextVaccination) nextVaccinations.push({ animal, date: nextVaccination });

  if (notes) {
    // "11/10/25 Visual of small round worms…" → dated note; else undated.
    const dm = notes.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(.*)$/);
    if (dm) {
      noteEvents.push({ animal, date: normalizeDate(dm[1]), text: dm[2] || notes });
    } else {
      noteEvents.push({ animal, date: null, text: notes });
    }
  }
}

// ── Parse yard-wide CSV ──
const yardCsv = readFileSync(YARD_CSV_PATH, "utf-8");
const yardLines = yardCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
const yardRows: Array<{ date: string; drug: string; dose: string }> = [];
for (let i = 1; i < yardLines.length; i++) {
  const cols = parseCSVLine(yardLines[i]);
  const date = normalizeDate(cols[0]?.trim() || "");
  if (!date) continue;
  yardRows.push({ date, drug: cleanTitle(cols[1]?.trim() || ""), dose: cols[2]?.trim() || "" });
}
yardRows.sort((a, b) => b.date.localeCompare(a.date));

// ── Emit ──
const dwRows = dewormingEvents
  .map(
    (e, idx) =>
      `  { id: ${JSON.stringify(`med-dw-${idx}`)}, animal: ${JSON.stringify(e.animal)}, type: "Deworming", title: ${JSON.stringify(e.title)}, date: ${JSON.stringify(e.date)}, description: ${JSON.stringify(e.description || "Imported from deworming checklist.")}, urgent: false }`
  )
  .join(",\n");

const vxRows = vaccinationEvents
  .map((e, idx) => {
    // Dental work logged in the vaccination column keeps its real category.
    const type = /dental/i.test(e.title) ? "Hoof & Dental" : "Vaccination";
    return `  { id: ${JSON.stringify(`med-vx-${idx}`)}, animal: ${JSON.stringify(e.animal)}, type: ${JSON.stringify(type)}, title: ${JSON.stringify(e.title)}, date: ${JSON.stringify(e.date)}, description: ${JSON.stringify(e.description || "Imported from deworming checklist.")}, urgent: false }`;
  })
  .join(",\n");

const todayIso = new Date().toISOString().split("T")[0];
const noteRows = noteEvents
  .map(
    (e, idx) =>
      `  { id: ${JSON.stringify(`med-note-${idx}`)}, animal: ${JSON.stringify(e.animal)}, type: "Condition", title: "Note", date: ${JSON.stringify(e.date ?? todayIso)}, description: ${JSON.stringify(e.text)}, urgent: false }`
  )
  .join(",\n");

const nextVaccRows = nextVaccinations
  .map((e) => `  [${JSON.stringify(e.animal)}, ${JSON.stringify(e.date)}]`)
  .join(",\n");

const yardRowsOut = yardRows
  .map(
    (r, idx) =>
      `  { id: ${JSON.stringify(`yard-${idx}`)}, date: ${JSON.stringify(r.date)}, drug: ${JSON.stringify(r.drug)}, dose: ${JSON.stringify(r.dose)} }`
  )
  .join(",\n");

const out = `// AUTO-GENERATED by scripts/parse-deworming-csv.ts
// Sources: src/lib/data/deworming-vaccination.csv, yard-wide-deworming.csv
// (the "Deworming and Vaccination Checklist APP FINAL" sheet)
// Do not edit by hand — re-run the parser instead.

import type { MedicalEntry } from "./medical-data";

export const importedDewormingEntries: MedicalEntry[] = [
${dwRows}${dwRows ? "," : ""}
];

export const importedVaccinationEntries: MedicalEntry[] = [
${vxRows}${vxRows ? "," : ""}
];

// Dated observations from the checklist's Notes column.
export const checklistNoteEntries: MedicalEntry[] = [
${noteRows}${noteRows ? "," : ""}
];

export interface YardWideDeworming {
  id: string;
  date: string; // ISO YYYY-MM-DD
  drug: string;
  dose: string;
}

// Yard-wide dosing schedule (dashboard widget). Per-donkey doses live in each
// donkey's own history above, so these are NOT expanded into per-animal rows.
export const yardWideDewormings: YardWideDeworming[] = [
${yardRowsOut}${yardRowsOut ? "," : ""}
];

// ── Next-vaccination dates per donkey (Next Vaccination column) ──
// Used by the medical dashboard to surface upcoming/overdue boosters.
export const nextVaccinationByAnimal: Map<string, string> = new Map([
${nextVaccRows}${nextVaccRows ? "," : ""}
]);

export function getNextVaccinationDue(animalName: string): string | null {
  return nextVaccinationByAnimal.get(animalName) ?? null;
}

// Emit the next-vaccination dates as scheduled MedicalEntry records so they
// flow through the dashboard's existing Upcoming / Overdue / Recent tabs.
// Urgency is computed at evaluation time relative to today.
export const scheduledVaccinationEntries: MedicalEntry[] = (() => {
  const out: MedicalEntry[] = [];
  let idx = 200000;
  const today = new Date().toISOString().split("T")[0];
  for (const [animal, date] of nextVaccinationByAnimal) {
    const isOverdue = date < today;
    out.push({
      id: \`scheduled-vacc-\${idx++}\`,
      animal,
      type: "Vaccination",
      title: isOverdue ? "Vaccination Overdue" : "Upcoming Vaccination",
      date,
      description: isOverdue
        ? "Vaccination booster is past due — schedule as soon as possible."
        : "Vaccination booster scheduled per the deworming checklist.",
      urgent: isOverdue,
    });
  }
  return out;
})();

export const importedMedicalEntries: MedicalEntry[] = [
  ...importedDewormingEntries,
  ...importedVaccinationEntries,
  ...checklistNoteEntries,
  ...scheduledVaccinationEntries,
];
`;

writeFileSync(OUT_PATH, out);

console.log(`✓ Wrote ${OUT_PATH}`);
console.log(`  Deworming entries: ${dewormingEvents.length}`);
console.log(`  Vaccination entries: ${vaccinationEvents.length}`);
console.log(`  Notes: ${noteEvents.length} · Next-vaccination dates: ${nextVaccinations.length}`);
console.log(`  Yard-wide protocol rows: ${yardRows.length}`);
