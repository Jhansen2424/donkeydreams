import { animals } from "./animals";
import { watchList } from "./sanctuary-data";

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
export const providers = [
  { name: "Dr. Martinez", type: "Farrier" as const, phone: "(760) 555-0142" },
  { name: "Desert Hoof Care", type: "Farrier" as const, phone: "(760) 555-0198" },
  { name: "Dr. Chen", type: "Equine Dentist" as const, phone: "(760) 555-0267" },
  { name: "Valley Equine Dental", type: "Equine Dentist" as const, phone: "(760) 555-0311" },
];

// ── Per-animal intervals (special needs animals get shorter intervals) ──
const specialHoofAnimals = new Set(["Gabriel", "Shelley", "Pete", "Swayze"]);
const specialDentalAnimals = new Set(["Blossom", "Pete", "Gabriel"]);

function getInterval(animalName: string): CareInterval {
  return {
    animal: animalName,
    hoofWeeks: specialHoofAnimals.has(animalName) ? 6 : 8,
    dentalMonths: specialDentalAnimals.has(animalName) ? 6 : 12,
    hoofNotes: specialHoofAnimals.has(animalName)
      ? animalName === "Gabriel"
        ? "Prosthetic leg — extra care on remaining hooves"
        : animalName === "Shelley"
          ? "Brace leg — careful positioning during trim"
          : "Senior — monitor for laminitis signs"
      : "",
    dentalNotes: specialDentalAnimals.has(animalName)
      ? animalName === "Blossom"
        ? "Dental issues — soft food only. Check for sharp points."
        : "Senior — may need sedation for float"
      : "",
  };
}

// ── Simulated visit history ──
// Generates realistic past visits so the page has data from day one
function generateVisitHistory(): CareVisit[] {
  const visits: CareVisit[] = [];
  const farriers = ["Dr. Martinez", "Desert Hoof Care"];
  const dentists = ["Dr. Chen", "Valley Equine Dental"];
  const today = new Date();

  // Give each animal 2-3 past hoof trims and 1-2 dental visits
  animals.forEach((animal, i) => {
    const interval = getInterval(animal.name);

    // Last hoof trim — scattered across recent weeks
    const hoofDaysAgo = ((i * 7 + 3) % (interval.hoofWeeks * 7)) + 5;
    const lastHoof = new Date(today);
    lastHoof.setDate(lastHoof.getDate() - hoofDaysAgo);
    visits.push({
      id: `hoof-${animal.slug}-1`,
      animal: animal.name,
      type: "hoof",
      date: lastHoof.toISOString().split("T")[0],
      provider: farriers[i % 2],
      notes: interval.hoofNotes || "Routine trim. All four hooves in good condition.",
    });

    // Previous hoof trim
    const prevHoof = new Date(lastHoof);
    prevHoof.setDate(prevHoof.getDate() - interval.hoofWeeks * 7);
    visits.push({
      id: `hoof-${animal.slug}-2`,
      animal: animal.name,
      type: "hoof",
      date: prevHoof.toISOString().split("T")[0],
      provider: farriers[(i + 1) % 2],
      notes: "Routine trim.",
    });

    // Last dental
    const dentalDaysAgo = ((i * 23 + 14) % (interval.dentalMonths * 30)) + 30;
    const lastDental = new Date(today);
    lastDental.setDate(lastDental.getDate() - dentalDaysAgo);
    visits.push({
      id: `dental-${animal.slug}-1`,
      animal: animal.name,
      type: "dental",
      date: lastDental.toISOString().split("T")[0],
      provider: dentists[i % 2],
      notes: interval.dentalNotes || "Float completed. No issues found.",
    });
  });

  return visits.sort((a, b) => b.date.localeCompare(a.date));
}

export const visitHistory = generateVisitHistory();

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

export function computeAnimalCareStatuses(): AnimalCareStatus[] {
  const today = new Date().toISOString().split("T")[0];

  return animals.map((animal) => {
    const interval = getInterval(animal.name);

    const hoofVisits = visitHistory
      .filter((v) => v.animal === animal.name && v.type === "hoof")
      .sort((a, b) => b.date.localeCompare(a.date));
    const dentalVisits = visitHistory
      .filter((v) => v.animal === animal.name && v.type === "dental")
      .sort((a, b) => b.date.localeCompare(a.date));

    const lastHoof = hoofVisits[0] ?? null;
    const lastDental = dentalVisits[0] ?? null;

    const nextHoofDue = lastHoof
      ? addDays(lastHoof.date, interval.hoofWeeks * 7)
      : null;
    const nextDentalDue = lastDental
      ? addDays(lastDental.date, interval.dentalMonths * 30)
      : null;

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
