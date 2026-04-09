import { animals } from "./animals";
import { watchList } from "./sanctuary-data";
import { donkeyWeights } from "./scheduled-and-events-data";

// ── Types ──
export type WeightTrend = "gaining" | "losing" | "stable" | "insufficient";
export type BCSScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type WeighInFlag = "normal" | "sudden-change" | "underweight" | "overweight" | "overdue";

export interface WeighIn {
  id: string;
  animal: string;
  date: string; // ISO date
  weight: number | null; // lbs — null if BCS-only entry
  bcs: BCSScore | null; // 1-9 body condition score
  notes: string;
  recordedBy: string;
}

export interface WeightConfig {
  animal: string;
  weighInIntervalDays: number; // how often to weigh
  targetBcsMin: BCSScore;
  targetBcsMax: BCSScore;
  alertThresholdPct: number; // % change that triggers an alert
}

export interface AnimalWeightStatus {
  animal: string;
  herd: string;
  lastWeighIn: WeighIn | null;
  previousWeighIn: WeighIn | null;
  trend: WeightTrend;
  weightChange: number | null; // lbs change
  weightChangePct: number | null; // % change
  lastBcs: BCSScore | null;
  daysSinceWeighIn: number | null;
  flag: WeighInFlag;
  config: WeightConfig;
  history: WeighIn[]; // last 8 entries for sparkline
}

// ── BCS Reference Guide ──
// Donkey-specific (they carry fat differently than horses — crest, rump, shoulder pads)
export const bcsGuide: { score: BCSScore; label: string; description: string; visual: string }[] = [
  { score: 1, label: "Emaciated", description: "Bone structure prominent. No fat cover on neck, ribs, or rump. Spine and hip bones visible.", visual: "🔴" },
  { score: 2, label: "Very Thin", description: "Slight fat cover. Ribs easily felt and partially visible. Neck thin, hip bones prominent.", visual: "🔴" },
  { score: 3, label: "Thin", description: "Ribs easily felt but not visible. Slight neck crest beginning. Spine can be felt.", visual: "🟠" },
  { score: 4, label: "Moderately Thin", description: "Ribs felt with light pressure. Faint neck crest. Rump starting to round.", visual: "🟡" },
  { score: 5, label: "Ideal", description: "Ribs felt with moderate pressure. Smooth neck crest. Rump well-rounded. No fat pads.", visual: "🟢" },
  { score: 6, label: "Moderately Fleshy", description: "Ribs require firm pressure to feel. Noticeable neck crest. Fat building on shoulders.", visual: "🟡" },
  { score: 7, label: "Fleshy", description: "Ribs difficult to feel. Pronounced neck crest. Fat pads on shoulders and rump.", visual: "🟠" },
  { score: 8, label: "Obese", description: "Ribs cannot be felt. Large neck crest (may lean). Prominent fat pads. Apple-shaped rump.", visual: "🔴" },
  { score: 9, label: "Extremely Obese", description: "Massive fat deposits. Neck crest falls to one side. Fat bulging on shoulders, rump, and inner thighs.", visual: "🔴" },
];

// ── Default configs ──
function getDefaultConfig(animalName: string): WeightConfig {
  const onWatchList = watchList.some((w) => w.animal === animalName);
  const animal = animals.find((a) => a.name === animalName);
  const isSenior = animal?.tags.some((t) => t.label === "Senior Care") ?? false;
  const isSpecialNeeds = animal?.status === "Special Needs";

  return {
    animal: animalName,
    weighInIntervalDays: onWatchList || isSpecialNeeds ? 7 : isSenior ? 14 : 30,
    targetBcsMin: 4,
    targetBcsMax: 6,
    alertThresholdPct: 5,
  };
}

// ── Weight history ──
// Real weights sourced from deworming schedule CSVs (see donkeyWeights map).
// For donkeys with a CSV weight, emit a single anchor weigh-in dated to when the
// CSVs were originally compiled. Donkeys without CSV data have no history yet —
// add via the /app/weight UI.
function buildWeightHistory(): WeighIn[] {
  const weighIns: WeighIn[] = [];
  // Approximate compile date of the CSVs (Jun 2025 deworming schedules).
  const csvAnchorDate = "2025-06-18";

  for (const animal of animals) {
    const csvWeight = donkeyWeights.get(animal.name);
    if (!csvWeight) continue;

    weighIns.push({
      id: `weight-csv-${animal.slug}`,
      animal: animal.name,
      date: csvAnchorDate,
      weight: csvWeight.lbs,
      bcs: null,
      notes: "Weight from deworming schedule CSV.",
      recordedBy: "CSV import",
    });
  }

  return weighIns.sort((a, b) => b.date.localeCompare(a.date));
}

export const weighInHistory = buildWeightHistory();

// ── Compute statuses ──
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getTrend(history: WeighIn[]): WeightTrend {
  const withWeight = history.filter((h) => h.weight !== null);
  if (withWeight.length < 2) return "insufficient";
  const recent = withWeight[0].weight!;
  const prev = withWeight[1].weight!;
  const pctChange = ((recent - prev) / prev) * 100;
  if (pctChange > 1.5) return "gaining";
  if (pctChange < -1.5) return "losing";
  return "stable";
}

function getFlag(
  status: { daysSinceWeighIn: number | null; weightChangePct: number | null; lastBcs: BCSScore | null },
  config: WeightConfig
): WeighInFlag {
  if (status.daysSinceWeighIn !== null && status.daysSinceWeighIn > config.weighInIntervalDays) {
    return "overdue";
  }
  if (status.weightChangePct !== null && Math.abs(status.weightChangePct) >= config.alertThresholdPct) {
    return "sudden-change";
  }
  if (status.lastBcs !== null && status.lastBcs < config.targetBcsMin) {
    return "underweight";
  }
  if (status.lastBcs !== null && status.lastBcs > config.targetBcsMax) {
    return "overweight";
  }
  return "normal";
}

export function computeWeightStatuses(allWeighIns?: WeighIn[]): AnimalWeightStatus[] {
  const data = allWeighIns ?? weighInHistory;
  const today = new Date().toISOString().split("T")[0];

  return animals.map((animal) => {
    const config = getDefaultConfig(animal.name);
    const history = data
      .filter((w) => w.animal === animal.name)
      .sort((a, b) => b.date.localeCompare(a.date));

    const last = history[0] ?? null;
    const prev = history[1] ?? null;

    const weightChange =
      last?.weight != null && prev?.weight != null
        ? last.weight - prev.weight
        : null;
    const weightChangePct =
      weightChange !== null && prev?.weight
        ? (weightChange / prev.weight) * 100
        : null;

    const daysSinceWeighIn = last
      ? daysBetween(last.date, today)
      : null;

    const lastBcs = history.find((h) => h.bcs !== null)?.bcs ?? null;

    const partial = { daysSinceWeighIn, weightChangePct, lastBcs };

    return {
      animal: animal.name,
      herd: animal.herd,
      lastWeighIn: last,
      previousWeighIn: prev,
      trend: getTrend(history),
      weightChange,
      weightChangePct,
      lastBcs,
      daysSinceWeighIn,
      flag: getFlag(partial, config),
      config,
      history: history.slice(0, 8),
    };
  });
}

// ── Stats ──
export function getWeightStats(allWeighIns?: WeighIn[]) {
  const statuses = computeWeightStatuses(allWeighIns);
  return {
    gaining: statuses.filter((s) => s.trend === "gaining").length,
    losing: statuses.filter((s) => s.trend === "losing").length,
    stable: statuses.filter((s) => s.trend === "stable").length,
    flagged: statuses.filter((s) => s.flag !== "normal").length,
    overdue: statuses.filter((s) => s.flag === "overdue").length,
    suddenChange: statuses.filter((s) => s.flag === "sudden-change").length,
    underweight: statuses.filter((s) => s.flag === "underweight").length,
    total: statuses.length,
  };
}

// ── Display helpers ──
export const trendMeta: Record<WeightTrend, { label: string; color: string; icon: string }> = {
  gaining: { label: "Gaining", color: "text-amber-600", icon: "↑" },
  losing: { label: "Losing", color: "text-red-600", icon: "↓" },
  stable: { label: "Stable", color: "text-emerald-600", icon: "→" },
  insufficient: { label: "—", color: "text-warm-gray", icon: "·" },
};

export const flagMeta: Record<WeighInFlag, { label: string; color: string; bg: string; dot: string }> = {
  normal: { label: "Normal", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  "sudden-change": { label: "Sudden Change", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  underweight: { label: "Underweight", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  overweight: { label: "Overweight", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  overdue: { label: "Overdue", color: "text-warm-gray", bg: "bg-gray-100 border-gray-300", dot: "bg-gray-400" },
};

export const bcsColor = (score: BCSScore): string => {
  if (score <= 2) return "text-red-600 bg-red-50 border-red-200";
  if (score <= 3) return "text-orange-600 bg-orange-50 border-orange-200";
  if (score >= 8) return "text-red-600 bg-red-50 border-red-200";
  if (score >= 7) return "text-orange-600 bg-orange-50 border-orange-200";
  if (score >= 4 && score <= 6) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  return "text-warm-gray bg-gray-50 border-gray-200";
};
