import { animals } from "./animals";
import { watchList } from "./sanctuary-data";
import { importedHoofVisits } from "./trimming-data";

// ── Types ──
export type CareType = "hoof" | "dental";
export type VisitStatus = "overdue" | "due-soon" | "good" | "no-history";

export interface CareVisit {
  id: string;
  animal: string;
  type: CareType;
  date: string; // ISO date
  provider: string;
  notes: string;
}

export interface CareInterval {
  animal: string;
  hoofWeeks: number; // weeks between trims
  dentalMonths: number; // months between floats
  hoofNotes: string;
  dentalNotes: string;
}

export interface AnimalCareStatus {
  animal: string;
  herd: string;
  hoofStatus: VisitStatus;
  dentalStatus: VisitStatus;
  lastHoofTrim: CareVisit | null;
  lastDental: CareVisit | null;
  nextHoofDue: string | null; // ISO date
  nextDentalDue: string | null;
  hoofInterval: number;
  dentalInterval: number;
  hoofNotes: string;
  dentalNotes: string;
  daysUntilHoof: number | null;
  daysUntilDental: number | null;
}

// ── Providers ──
// `type` is intentionally typed as plain `string` so downstream consumers
// (ProviderPanel, medical page) can extend the set without TypeScript
// narrowing the seed data into a strict literal union.
export interface ProviderSeed {
  name: string;
  type: string;
  phone: string;
}

// 2026-08-24: blank slate — provider seed list emptied; providers now live
// solely in the DB (added via the app).
export const providers: ProviderSeed[] = [];

// ── Per-animal hoof intervals ──
// 2026-08-24: blank slate — the per-animal interval/notes overrides sourced
// from donkey-trimming-notes.csv were wiped pending re-import from the new
// spreadsheets. Every animal uses the default intervals until then.
const hoofIntervalOverrides: Record<string, { weeks: number; notes: string }> = {};

const specialDentalAnimals = new Set<string>();

function getInterval(animalName: string): CareInterval {
  const hoofOverride = hoofIntervalOverrides[animalName];
  return {
    animal: animalName,
    hoofWeeks: hoofOverride?.weeks ?? 8,
    dentalMonths: specialDentalAnimals.has(animalName) ? 6 : 12,
    hoofNotes: hoofOverride?.notes ?? "",
    dentalNotes: "",
  };
}

// ── Visit history ──
// Real hoof trim data parsed from donkey-trimming-notes.csv (see scripts/parse-trimming-csv.ts).
// Dental visits are not yet imported — add manually via the /app/hoof-dental dashboard.
export const visitHistory: CareVisit[] = [...importedHoofVisits].sort((a, b) =>
  b.date.localeCompare(a.date)
);

// ── Compute status for each animal ──
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getStatus(daysUntil: number | null): VisitStatus {
  if (daysUntil === null) return "no-history";
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 14) return "due-soon";
  return "good";
}

export interface ComputeOptions {
  /** Additional DB-backed visits to merge on top of the seed `visitHistory`. */
  extraVisits?: CareVisit[];
  /** Per-animal next-due overrides (from the Animal table). */
  nextDueByAnimal?: Record<string, { nextHoofDue?: string | null; nextDentalDue?: string | null }>;
}

export function computeAnimalCareStatuses(
  options: ComputeOptions = {}
): AnimalCareStatus[] {
  const today = new Date().toISOString().split("T")[0];
  const extra = options.extraVisits ?? [];
  const allVisits = [...visitHistory, ...extra];

  return animals.map((animal) => {
    const interval = getInterval(animal.name);

    const hoofVisits = allVisits
      .filter((v) => v.animal === animal.name && v.type === "hoof")
      .sort((a, b) => b.date.localeCompare(a.date));
    const dentalVisits = allVisits
      .filter((v) => v.animal === animal.name && v.type === "dental")
      .sort((a, b) => b.date.localeCompare(a.date));

    const lastHoof = hoofVisits[0] ?? null;
    const lastDental = dentalVisits[0] ?? null;

    // Prefer explicit next-due from DB (set by Joshy or user) over the
    // interval-derived estimate. Falls back to "last visit + interval".
    const manualNext = options.nextDueByAnimal?.[animal.name];
    const nextHoofDue = manualNext?.nextHoofDue
      ?? (lastHoof ? addDays(lastHoof.date, interval.hoofWeeks * 7) : null);
    const nextDentalDue = manualNext?.nextDentalDue
      ?? (lastDental ? addDays(lastDental.date, interval.dentalMonths * 30) : null);

    const daysUntilHoof = nextHoofDue ? daysBetween(today, nextHoofDue) : null;
    const daysUntilDental = nextDentalDue
      ? daysBetween(today, nextDentalDue)
      : null;

    return {
      animal: animal.name,
      herd: animal.herd,
      hoofStatus: getStatus(daysUntilHoof),
      dentalStatus: getStatus(daysUntilDental),
      lastHoofTrim: lastHoof,
      lastDental,
      nextHoofDue,
      nextDentalDue,
      hoofInterval: interval.hoofWeeks,
      dentalInterval: interval.dentalMonths,
      hoofNotes: interval.hoofNotes,
      dentalNotes: interval.dentalNotes,
      daysUntilHoof,
      daysUntilDental,
    };
  });
}

// ── Stats ──
export function getHoofDentalStats() {
  const statuses = computeAnimalCareStatuses();
  const hoofOverdue = statuses.filter((s) => s.hoofStatus === "overdue").length;
  const hoofDueSoon = statuses.filter((s) => s.hoofStatus === "due-soon").length;
  const dentalOverdue = statuses.filter(
    (s) => s.dentalStatus === "overdue"
  ).length;
  const dentalDueSoon = statuses.filter(
    (s) => s.dentalStatus === "due-soon"
  ).length;

  // Find next upcoming farrier date (earliest nextHoofDue that's in the future)
  const today = new Date().toISOString().split("T")[0];
  const upcomingHoof = statuses
    .filter((s) => s.nextHoofDue && s.nextHoofDue >= today)
    .sort((a, b) => a.nextHoofDue!.localeCompare(b.nextHoofDue!));

  // Animals on watch list that have hoof/dental concerns
  const watchAnimals = new Set(watchList.map((w) => w.animal));
  const watchCareAnimals = statuses.filter(
    (s) =>
      watchAnimals.has(s.animal) &&
      (s.hoofStatus === "overdue" || s.dentalStatus === "overdue")
  );

  return {
    hoofOverdue,
    hoofDueSoon,
    dentalOverdue,
    dentalDueSoon,
    totalAnimals: statuses.length,
    nextFarrierVisit: upcomingHoof[0]?.nextHoofDue ?? null,
    dueThisWeek:
      statuses.filter(
        (s) =>
          (s.daysUntilHoof !== null && s.daysUntilHoof >= 0 && s.daysUntilHoof <= 7) ||
          (s.daysUntilDental !== null && s.daysUntilDental >= 0 && s.daysUntilDental <= 7)
      ).length,
    watchCareCount: watchCareAnimals.length,
  };
}

// ── Status display helpers ──
export const statusMeta: Record<
  VisitStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  overdue: {
    label: "Overdue",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  "due-soon": {
    label: "Due Soon",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  good: {
    label: "Good",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  "no-history": {
    label: "No Record",
    color: "text-warm-gray",
    bg: "bg-gray-50 border-gray-200",
    dot: "bg-gray-400",
  },
};
