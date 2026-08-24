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

// ── Sponsor data ──
// 2026-08-24: blank slate — sample sponsor data removed pending real records.

export const sponsors: Sponsor[] = [];

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
