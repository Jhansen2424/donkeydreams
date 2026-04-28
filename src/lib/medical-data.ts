// ── Centralized Medical Entries for the Sanctuary ──

export type MedicalEntryType =
  | "Vet Visit"
  | "Hoof & Dental"
  | "Medication"
  | "Lab Result"
  | "Temperature"
  | "Weight"
  | "Vaccination"
  | "Deworming"
  | "Fecal Test"
  | "Other";

export interface MedicalEntry {
  id: string;
  animal: string;
  type: MedicalEntryType;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  urgent: boolean;
  /** Vet, farrier, or other provider who performed the service. */
  provider?: string;
}

// Backwards-compatible aliases
export type MedicalRecordType = MedicalEntryType;
export type MedicalRecord = MedicalEntry;

export const entryTypes: MedicalEntryType[] = [
  "Vet Visit",
  "Hoof & Dental",
  "Medication",
  "Lab Result",
  "Temperature",
  "Weight",
  "Vaccination",
  "Deworming",
  "Fecal Test",
  "Other",
];

export const recordTypes = entryTypes;

export const typeBadgeColors: Record<
  MedicalEntryType,
  { bg: string; text: string }
> = {
  "Vet Visit": { bg: "bg-sky-100", text: "text-sky-700" },
  "Hoof & Dental": { bg: "bg-amber-100", text: "text-amber-700" },
  Medication: { bg: "bg-purple-100", text: "text-purple-700" },
  "Lab Result": { bg: "bg-emerald-100", text: "text-emerald-700" },
  Temperature: { bg: "bg-red-100", text: "text-red-700" },
  Weight: { bg: "bg-slate-100", text: "text-slate-700" },
  Vaccination: { bg: "bg-green-100", text: "text-green-700" },
  Deworming: { bg: "bg-orange-100", text: "text-orange-700" },
  "Fecal Test": { bg: "bg-teal-100", text: "text-teal-700" },
  Other: { bg: "bg-gray-100", text: "text-gray-700" },
};

let nextId = 1;
function rec(
  animal: string,
  type: MedicalRecordType,
  title: string,
  date: string,
  description: string,
  urgent = false
): MedicalEntry {
  return {
    id: `med-${nextId++}`,
    animal,
    type,
    title,
    date,
    description,
    urgent,
  };
}

export const medicalEntries: MedicalEntry[] = [];
// Dummy hand-typed medical entries removed. Real records live in Neon and in
// the CSV-sourced imports below (deworming, power-pack, brave events, etc.).

// Backwards-compatible alias
export const medicalRecords = medicalEntries;

// ── Imported entries (parsed from CSVs) ──
import { importedMedicalEntries } from "./deworming-vaccination-data";
import { powerPackEntries } from "./power-pack-data";
import {
  braveActualEntries,
  scheduledDewormingEntries,
} from "./scheduled-and-events-data";
import { annualExamEntries } from "./donkey-profiles-data";

// Sources of deworming truth, in order of authority (highest first):
//   1. brave-events.csv  → braveActualEntries  (per-donkey events with weights)
//   2. power-pack-doses.csv → powerPackEntries (day-by-day power-pack log)
//   3. deworming-vaccination.csv (history strings) → importedMedicalEntries
// When a higher-authority source has a record for (animal, drug) within
// OVERLAP_DAYS, lower-authority records are dropped.

function dayDiff(a: string, b: string): number {
  return Math.abs(
    Math.round(
      (new Date(a + "T00:00:00").getTime() -
        new Date(b + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function entryDrug(e: MedicalEntry): string | null {
  const t = e.title.toLowerCase();
  if (t.includes("fenbendazole")) return "Fenbendazole";
  if (t.includes("pyrantel")) return "Pyrantel";
  if (t.includes("ivermectin")) return "Ivermectin";
  if (t.includes("moxidectin")) return "Moxidectin";
  if (t.includes("tri-wormer")) return "Tri-wormer";
  return null;
}

const OVERLAP_DAYS = 7; // wider window for power-pack vs power-pack overlap

// Brave events are the authoritative source for Brave herd dosing.
// Drop any power-pack entry for an animal that also has a Brave event for the
// same drug within OVERLAP_DAYS — the Brave events have the correct start dates.
const dedupedPowerPackEntries = powerPackEntries.filter((pp) => {
  return !braveActualEntries.some((b) => {
    if (b.animal !== pp.animal) return false;
    const bDrug = entryDrug(b);
    if (bDrug !== pp.drug) return false;
    return dayDiff(b.date, pp.date) <= OVERLAP_DAYS;
  });
});

// Then drop summary-level entries that overlap with EITHER higher-authority source.
const dedupedDewormingImports = importedMedicalEntries.filter((e) => {
  if (e.type !== "Deworming") return true;
  const drug = entryDrug(e);
  if (!drug) return true;
  const overlapsHighAuth = (other: { animal: string; date: string; drug?: string; title?: string }) => {
    if (other.animal !== e.animal) return false;
    const otherDrug =
      "drug" in other && other.drug
        ? other.drug
        : entryDrug(other as MedicalEntry);
    if (otherDrug !== drug) return false;
    return dayDiff(other.date, e.date) <= OVERLAP_DAYS;
  };
  if (dedupedPowerPackEntries.some(overlapsHighAuth)) return false;
  if (braveActualEntries.some(overlapsHighAuth)) return false;
  return true;
});

// Strip the extra `drug` field from power-pack entries when merging into MedicalEntry[]
const powerPackAsMedical: MedicalEntry[] = dedupedPowerPackEntries.map(
  ({ drug: _drug, ...rest }) => rest
);

export const allMedicalEntries: MedicalEntry[] = [
  ...medicalEntries,
  ...dedupedDewormingImports,
  ...powerPackAsMedical,
  ...braveActualEntries,
  ...scheduledDewormingEntries,
  ...annualExamEntries,
];

// ── Helper Functions ──

export function getEntriesForAnimal(animalName: string): MedicalEntry[] {
  return allMedicalEntries
    .filter((r) => r.animal === animalName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getRecordsForAnimal = getEntriesForAnimal;

export function getAllEntriesSorted(): MedicalEntry[] {
  return [...allMedicalEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const getAllRecordsSorted = getAllEntriesSorted;

export function getOverdueEntries(today: Date): MedicalEntry[] {
  return medicalEntries
    .filter((r) => {
      const d = new Date(r.date);
      return d < today && r.urgent;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const getOverdueRecords = getOverdueEntries;

export function getUpcomingEntries(today: Date): MedicalEntry[] {
  return medicalEntries
    .filter((r) => new Date(r.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const getUpcomingRecords = getUpcomingEntries;

export function getRecentEntries(today: Date, days = 30): MedicalEntry[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  return medicalEntries
    .filter((r) => {
      const d = new Date(r.date);
      return d >= cutoff && d <= today;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getRecentRecords = getRecentEntries;
