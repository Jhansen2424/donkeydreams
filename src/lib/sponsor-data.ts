import { animals } from "./animals";

// ── Types ──

export interface Sponsor {
  id: string;
  name: string;
  email: string;
  tier: "Silver" | "Gold" | "Platinum";
  animal: string;
  startDate: string; // ISO date
  lastUpdateSent: string; // ISO date
  updateInterval: number; // days between updates (default 30)
}

export interface AnimalSponsorStatus {
  animal: string;
  sponsorable: boolean;
  sponsors: Sponsor[];
  daysSinceLastUpdate: number | null;
  updateOverdue: boolean;
}

// ── Tier metadata ──

export const tierMeta: Record<Sponsor["tier"], { label: string; color: string; bg: string; amount: string }> = {
  Silver: { label: "Silver", color: "text-gray-600", bg: "bg-gray-100 border-gray-200", amount: "$60/mo" },
  Gold: { label: "Gold", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", amount: "$90/mo" },
  Platinum: { label: "Platinum", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", amount: "$125/mo" },
};

// ── Sample sponsor data ──
// Realistic mix: some animals have multiple sponsors, some have none

export const sponsors: Sponsor[] = [
  {
    id: "sp-1",
    name: "Linda & Tom K.",
    email: "linda.k@example.com",
    tier: "Gold",
    animal: "Shelley",
    startDate: "2025-06-15",
    lastUpdateSent: "2026-03-01",
    updateInterval: 30,
  },
  {
    id: "sp-2",
    name: "The Martinez Family",
    email: "martinez.fam@example.com",
    tier: "Platinum",
    animal: "Shelley",
    startDate: "2025-09-01",
    lastUpdateSent: "2026-03-01",
    updateInterval: 30,
  },
  {
    id: "sp-3",
    name: "David R.",
    email: "david.r@example.com",
    tier: "Silver",
    animal: "Rusty",
    startDate: "2025-11-20",
    lastUpdateSent: "2026-02-20",
    updateInterval: 30,
  },
  {
    id: "sp-4",
    name: "Sarah & Mike P.",
    email: "sarah.p@example.com",
    tier: "Gold",
    animal: "Captain",
    startDate: "2025-08-10",
    lastUpdateSent: "2026-03-10",
    updateInterval: 30,
  },
  {
    id: "sp-5",
    name: "Jennifer W.",
    email: "jen.w@example.com",
    tier: "Gold",
    animal: "Samson",
    startDate: "2026-01-05",
    lastUpdateSent: "2026-03-05",
    updateInterval: 30,
  },
  {
    id: "sp-6",
    name: "Carol B.",
    email: "carol.b@example.com",
    tier: "Silver",
    animal: "Cinnamon",
    startDate: "2025-12-01",
    lastUpdateSent: "2026-02-15",
    updateInterval: 30,
  },
  {
    id: "sp-7",
    name: "James & Ann H.",
    email: "james.h@example.com",
    tier: "Platinum",
    animal: "Rosie",
    startDate: "2025-07-01",
    lastUpdateSent: "2026-03-15",
    updateInterval: 30,
  },
  {
    id: "sp-8",
    name: "Megan T.",
    email: "megan.t@example.com",
    tier: "Silver",
    animal: "Rosie",
    startDate: "2026-02-14",
    lastUpdateSent: "2026-02-14",
    updateInterval: 30,
  },
  {
    id: "sp-9",
    name: "Bob & Janet L.",
    email: "bob.l@example.com",
    tier: "Gold",
    animal: "Dusty",
    startDate: "2025-10-01",
    lastUpdateSent: "2026-02-28",
    updateInterval: 30,
  },
  {
    id: "sp-10",
    name: "The Nguyen Family",
    email: "nguyen.family@example.com",
    tier: "Platinum",
    animal: "Cookie",
    startDate: "2025-05-20",
    lastUpdateSent: "2026-03-20",
    updateInterval: 30,
  },
  {
    id: "sp-11",
    name: "Patricia D.",
    email: "pat.d@example.com",
    tier: "Silver",
    animal: "Captain",
    startDate: "2026-01-15",
    lastUpdateSent: "2026-02-15",
    updateInterval: 30,
  },
];

// ── Computed statuses ──

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getSponsorsForAnimal(animalName: string): Sponsor[] {
  return sponsors.filter((s) => s.animal === animalName);
}

export function computeSponsorStatuses(): AnimalSponsorStatus[] {
  const today = new Date().toISOString().split("T")[0];

  return animals
    .filter((a) => a.sponsorable)
    .map((animal) => {
      const animalSponsors = getSponsorsForAnimal(animal.name);

      // Find the most recent update sent across all sponsors for this animal
      const lastUpdate = animalSponsors.length > 0
        ? animalSponsors
            .map((s) => s.lastUpdateSent)
            .sort((a, b) => b.localeCompare(a))[0]
        : null;

      const daysSinceLastUpdate = lastUpdate ? daysBetween(lastUpdate, today) : null;
      const updateOverdue = daysSinceLastUpdate !== null && daysSinceLastUpdate >= 30;

      return {
        animal: animal.name,
        sponsorable: animal.sponsorable,
        sponsors: animalSponsors,
        daysSinceLastUpdate,
        updateOverdue,
      };
    });
}

export function getAnimalsNeedingUpdates(): AnimalSponsorStatus[] {
  return computeSponsorStatuses().filter((s) => s.updateOverdue && s.sponsors.length > 0);
}
