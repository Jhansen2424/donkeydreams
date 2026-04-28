"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  computeWeightStatuses,
  getWeightStats,
  trendMeta,
  flagMeta,
  bcsColor,
  bcsGuide,
  weighInHistory,
  type AnimalWeightStatus,
  type WeighIn,
  type BCSScore,
  type WeighInFlag,
  type WeightTrend,
} from "@/lib/weight-data";
import { animals } from "@/lib/animals";
import { formatDate as sharedFormatDate } from "@/lib/format-date";

// ── Helpers ──

function slugify(name: string) {
  return name.toLowerCase().replace(/[\s-]+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Routed through the centralized MM-DD-YYYY helper.
function formatDate(iso: string) {
  return sharedFormatDate(iso);
}

function formatDateFull(iso: string) {
  return sharedFormatDate(iso);
}

// ── Mini Sparkline (pure CSS) ──

function Sparkline({ history }: { history: WeighIn[] }) {
  const weights = history
    .filter((h) => h.weight !== null)
    .slice(0, 6)
    .reverse()
    .map((h) => h.weight!);

  if (weights.length < 2) return <span className="text-warm-gray/40 text-xs">—</span>;

  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const h = 28;
  const w = 64;
  const step = w / (weights.length - 1);

  const points = weights
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");

  const trending = weights[weights.length - 1] >= weights[weights.length - 2];

  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline
        points={points}
        fill="none"
        stroke={trending ? "#059669" : "#dc2626"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {weights.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - ((v - min) / range) * (h - 4) - 2}
          r={i === weights.length - 1 ? 2.5 : 1.5}
          fill={i === weights.length - 1 ? (trending ? "#059669" : "#dc2626") : "#9ca3af"}
        />
      ))}
    </svg>
  );
}

// ── BCS Dot ──

function BcsBadge({ score }: { score: BCSScore | null }) {
  if (score === null) return <span className="text-warm-gray/40 text-xs">—</span>;
  const colors = bcsColor(score);
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${colors}`}>
      {score}/9
    </span>
  );
}

// ── Flag Badge ──

function FlagBadge({ flag }: { flag: WeighInFlag }) {
  if (flag === "normal") return null;
  const meta = flagMeta[flag];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// ── Trend Icon ──

function TrendIcon({ trend }: { trend: WeightTrend }) {
  const meta = trendMeta[trend];
  const Icon = trend === "gaining" ? TrendingUp : trend === "losing" ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

// ── Sort + Filter types ──

type SortField = "animal" | "weight" | "bcs" | "trend" | "flag" | "lastWeighIn" | "change";
type SortDir = "asc" | "desc";
type FilterFlag = WeighInFlag | "all";
type FilterTrend = WeightTrend | "all";

const flagOrder: Record<WeighInFlag, number> = {
  "sudden-change": 0,
  underweight: 1,
  overweight: 2,
  overdue: 3,
  normal: 4,
};

// ── Page ──

interface ApiWeighIn {
  id: string;
  animal: string;
  date: string;
  weight: number | null;
  bcs: number | null;
  notes: string;
  recordedBy: string;
}

export default function WeightTrackingPage() {
  const [dbWeighIns, setDbWeighIns] = useState<WeighIn[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load DB weigh-ins. Seed `weighInHistory` (CSV-derived anchor weights)
  // stays as a fallback so animals with no live data still render.
  const reloadWeighIns = useCallback(async () => {
    try {
      const res = await fetch("/api/weight", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const body = (await res.json()) as { entries: ApiWeighIn[] };
      setDbWeighIns(
        body.entries.map((e) => ({
          id: e.id,
          animal: e.animal,
          date: e.date,
          weight: e.weight,
          bcs: (e.bcs as BCSScore | null) ?? null,
          notes: e.notes,
          recordedBy: e.recordedBy || "Staff",
        }))
      );
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load weigh-ins");
    }
  }, []);

  useEffect(() => {
    void reloadWeighIns();
  }, [reloadWeighIns]);

  const allWeighIns = useMemo(() => [...weighInHistory, ...dbWeighIns], [dbWeighIns]);

  const statuses = useMemo(() => computeWeightStatuses(allWeighIns), [allWeighIns]);
  const stats = useMemo(() => getWeightStats(allWeighIns), [allWeighIns]);

  // UI state
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("flag");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterFlag, setFilterFlag] = useState<FilterFlag>("all");
  const [filterTrend, setFilterTrend] = useState<FilterTrend>("all");
  const [filterHerd, setFilterHerd] = useState<string>("all");
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null);
  const [showBcsGuide, setShowBcsGuide] = useState(false);

  // Batch weigh-in state
  const [batchMode, setBatchMode] = useState(false);
  const [batchEntries, setBatchEntries] = useState<
    { animal: string; weight: string; bcs: string; notes: string; done: boolean }[]
  >([]);
  const [batchRecordedBy, setBatchRecordedBy] = useState("Staff");
  const batchRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Herds for filter
  const herds = useMemo(() => {
    const h = new Set(animals.map((a) => a.herd));
    return ["all", ...Array.from(h).sort()];
  }, []);

  // ── Filter + Sort ──
  const filtered = useMemo(() => {
    let result = statuses;

    if (filterFlag !== "all") result = result.filter((s) => s.flag === filterFlag);
    if (filterTrend !== "all") result = result.filter((s) => s.trend === filterTrend);
    if (filterHerd !== "all") result = result.filter((s) => s.herd === filterHerd);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.animal.toLowerCase().includes(q) ||
          s.herd.toLowerCase().includes(q) ||
          (s.lastWeighIn?.notes || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "animal":
          cmp = a.animal.localeCompare(b.animal);
          break;
        case "weight":
          cmp = (a.lastWeighIn?.weight ?? 0) - (b.lastWeighIn?.weight ?? 0);
          break;
        case "bcs":
          cmp = (a.lastBcs ?? 0) - (b.lastBcs ?? 0);
          break;
        case "trend":
          cmp = a.trend.localeCompare(b.trend);
          break;
        case "flag":
          cmp = flagOrder[a.flag] - flagOrder[b.flag];
          break;
        case "lastWeighIn":
          cmp = (a.daysSinceWeighIn ?? 999) - (b.daysSinceWeighIn ?? 999);
          break;
        case "change":
          cmp = (a.weightChangePct ?? 0) - (b.weightChangePct ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [statuses, search, sortField, sortDir, filterFlag, filterTrend, filterHerd]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    const active = sortField === field;
    return (
      <button
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-charcoal transition-colors ${
          active ? "text-charcoal" : "text-warm-gray/60"
        } ${className || ""}`}
      >
        {label}
        {active &&
          (sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          ))}
      </button>
    );
  }

  // ── Batch Weigh-in ──

  function startBatch() {
    // Pre-populate with overdue + due-soon animals first, then all
    const overdueNames = new Set(
      statuses.filter((s) => s.flag === "overdue").map((s) => s.animal)
    );
    const sorted = [...animals].sort((a, b) => {
      const aOverdue = overdueNames.has(a.name) ? 0 : 1;
      const bOverdue = overdueNames.has(b.name) ? 0 : 1;
      return aOverdue - bOverdue || a.name.localeCompare(b.name);
    });

    setBatchEntries(
      sorted.map((a) => ({
        animal: a.name,
        weight: "",
        bcs: "",
        notes: "",
        done: false,
      }))
    );
    setBatchMode(true);
  }

  function handleBatchWeightChange(idx: number, value: string) {
    setBatchEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], weight: value };
      return next;
    });
  }

  function handleBatchBcsChange(idx: number, value: string) {
    setBatchEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], bcs: value };
      return next;
    });
  }

  function handleBatchNotesChange(idx: number, value: string) {
    setBatchEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], notes: value };
      return next;
    });
  }

  function handleBatchKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Enter" || e.key === "Tab") {
      // If weight field and there's a value, jump to next animal's weight field
      if (e.currentTarget.name === "weight" && !e.shiftKey) {
        e.preventDefault();
        const nextIdx = idx + 1;
        if (nextIdx < batchEntries.length) {
          batchRefs.current[nextIdx]?.focus();
          batchRefs.current[nextIdx]?.select();
        }
      }
    }
  }

  async function submitBatch() {
    const today = new Date().toISOString().split("T")[0];
    const payloads = batchEntries
      .map((entry) => ({
        animal: entry.animal,
        weight: entry.weight ? parseFloat(entry.weight) : null,
        bcs: entry.bcs ? parseInt(entry.bcs) : null,
        notes: entry.notes,
      }))
      .filter((p) => p.weight !== null || p.bcs !== null);

    if (payloads.length === 0) return;

    // Fire requests in parallel. Any failures surface as a load error banner
    // on next reload — batch entry is forgiving, one bad row shouldn't abort.
    try {
      await Promise.all(
        payloads.map((p) =>
          fetch("/api/weight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...p,
              date: today,
              recordedBy: batchRecordedBy,
            }),
          })
        )
      );
    } catch {
      // fallthrough to reload; partial successes still persist
    }

    await reloadWeighIns();
    setBatchMode(false);
    setBatchEntries([]);
  }

  const batchFilledCount = batchEntries.filter((e) => e.weight || e.bcs).length;

  // ── Single record form ──
  const [showAddForm, setShowAddForm] = useState(false);
  const [formAnimal, setFormAnimal] = useState(animals[0]?.name || "");
  const [formWeight, setFormWeight] = useState("");
  const [formBcs, setFormBcs] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formRecordedBy, setFormRecordedBy] = useState("Staff");

  async function handleAddSingle() {
    const weight = formWeight ? parseFloat(formWeight) : null;
    const bcs = formBcs ? parseInt(formBcs) : null;
    if (weight === null && bcs === null) return;

    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal: formAnimal,
          date: today,
          weight,
          bcs,
          notes: formNotes,
          recordedBy: formRecordedBy,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      await reloadWeighIns();
      setFormWeight("");
      setFormBcs("");
      setFormNotes("");
      setShowAddForm(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to save weigh-in");
    }
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Weight Tracking</h1>
          <p className="text-sm text-warm-gray mt-1">
            Body condition scores, weigh-ins, and trend monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (batchMode) {
                setBatchMode(false);
              } else {
                startBatch();
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              batchMode
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            {batchMode ? (
              <>
                <X className="w-4 h-4" />
                Cancel Batch
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Batch Weigh-in
              </>
            )}
          </button>
          {!batchMode && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Cancel" : "Add Record"}
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* ══════ BATCH WEIGH-IN MODE ══════ */}
      {batchMode && (
        <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-charcoal flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Batch Weigh-in
              </h3>
              <p className="text-sm text-warm-gray mt-0.5">
                Type weight, press Enter/Tab to jump to next animal. Overdue animals listed first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-bold text-charcoal">{batchFilledCount}</span>
                <span className="text-sm text-warm-gray ml-1">/ {batchEntries.length} recorded</span>
              </div>
              <select
                value={batchRecordedBy}
                onChange={(e) => setBatchRecordedBy(e.target.value)}
                className="px-3 py-2 text-sm border border-amber-200 rounded-lg bg-white text-charcoal appearance-none focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="Edj">Edj</option>
                <option value="Amber">Amber</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          {/* Batch grid */}
          <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">
            <div className="grid gap-1.5">
              {/* Header */}
              <div className="grid grid-cols-[1fr_100px_70px_1fr_32px] gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-warm-gray/60 sticky top-0 bg-amber-50/80 backdrop-blur-sm z-10">
                <span>Animal</span>
                <span>Weight (lbs)</span>
                <span>BCS</span>
                <span>Notes</span>
                <span></span>
              </div>

              {batchEntries.map((entry, idx) => {
                const status = statuses.find((s) => s.animal === entry.animal);
                const isOverdue = status?.flag === "overdue";
                return (
                  <div
                    key={entry.animal}
                    className={`grid grid-cols-[1fr_100px_70px_1fr_32px] gap-2 items-center px-3 py-2 rounded-lg ${
                      entry.weight || entry.bcs
                        ? "bg-emerald-50/50 border border-emerald-200"
                        : isOverdue
                          ? "bg-white border border-red-200"
                          : "bg-white border border-card-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-charcoal truncate">
                        {entry.animal}
                      </span>
                      {isOverdue && (
                        <span className="shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          OVERDUE
                        </span>
                      )}
                      {status?.lastWeighIn?.weight && (
                        <span className="shrink-0 text-[11px] text-warm-gray">
                          last: {status.lastWeighIn.weight} lbs
                        </span>
                      )}
                    </div>
                    <input
                      ref={(el) => { batchRefs.current[idx] = el; }}
                      name="weight"
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={entry.weight}
                      onChange={(e) => handleBatchWeightChange(idx, e.target.value)}
                      onKeyDown={(e) => handleBatchKeyDown(e, idx)}
                      className="w-full px-2 py-1.5 text-sm border border-card-border rounded-lg text-charcoal text-center focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                    />
                    <select
                      value={entry.bcs}
                      onChange={(e) => handleBatchBcsChange(idx, e.target.value)}
                      className="w-full px-1 py-1.5 text-sm border border-card-border rounded-lg text-charcoal text-center appearance-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={entry.notes}
                      onChange={(e) => handleBatchNotesChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    {(entry.weight || entry.bcs) && (
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch submit */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-200">
            <p className="text-sm text-warm-gray">
              {batchFilledCount === 0
                ? "Start typing weights — Tab/Enter jumps to the next animal"
                : `${batchFilledCount} animal${batchFilledCount !== 1 ? "s" : ""} ready to save`}
            </p>
            <button
              onClick={submitBatch}
              disabled={batchFilledCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Save {batchFilledCount} Record{batchFilledCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* ══════ SINGLE ADD FORM ══════ */}
      {showAddForm && !batchMode && (
        <div className="bg-white rounded-xl border border-card-border p-5 space-y-4">
          <h3 className="font-bold text-charcoal">Log Weigh-in</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Animal
              </label>
              <div className="relative">
                <select
                  value={formAnimal}
                  onChange={(e) => setFormAnimal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                >
                  {[...animals].sort((a, b) => a.name.localeCompare(b.name)).map((a) => (
                    <option key={a.slug} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                placeholder="e.g., 485"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                BCS (1-9)
              </label>
              <div className="relative">
                <select
                  value={formBcs}
                  onChange={(e) => setFormBcs(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                >
                  <option value="">—</option>
                  {bcsGuide.map((g) => (
                    <option key={g.score} value={g.score}>
                      {g.score} — {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Recorded By
              </label>
              <div className="relative">
                <select
                  value={formRecordedBy}
                  onChange={(e) => setFormRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                >
                  <option value="Edj">Edj</option>
                  <option value="Amber">Amber</option>
                  <option value="Staff">Staff</option>
                </select>
                <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddSingle}
                disabled={!formWeight && !formBcs}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional observation..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
        </div>
      )}

      {/* ══════ STAT CARDS ══════ */}
      {!batchMode && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.gaining}</p>
                <p className="text-xs text-warm-gray font-medium">Gaining</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.losing}</p>
                <p className="text-xs text-warm-gray font-medium">Losing</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Minus className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal">{stats.stable}</p>
                <p className="text-xs text-warm-gray font-medium">Stable</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.flagged}</p>
                <p className="text-xs text-warm-gray font-medium">Flagged</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{stats.overdue}</p>
                <p className="text-xs text-warm-gray font-medium">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ SEARCH + FILTERS ══════ */}
      {!batchMode && (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, herd, or notes..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-card-border rounded-xl text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 focus:border-sand"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/50 hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={filterFlag}
                onChange={(e) => setFilterFlag(e.target.value as FilterFlag)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                <option value="all">All Flags</option>
                <option value="sudden-change">Sudden Change</option>
                <option value="underweight">Underweight</option>
                <option value="overweight">Overweight</option>
                <option value="overdue">Overdue</option>
                <option value="normal">Normal</option>
              </select>
              <ChevronDown className="w-4 h-4 text-warm-gray absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterTrend}
                onChange={(e) => setFilterTrend(e.target.value as FilterTrend)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                <option value="all">All Trends</option>
                <option value="gaining">Gaining</option>
                <option value="losing">Losing</option>
                <option value="stable">Stable</option>
              </select>
              <ChevronDown className="w-4 h-4 text-warm-gray absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterHerd}
                onChange={(e) => setFilterHerd(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                {herds.map((h) => (
                  <option key={h} value={h}>
                    {h === "all" ? "All Herds" : h}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-warm-gray absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowBcsGuide(!showBcsGuide)}
              className="inline-flex items-center gap-1.5 ml-auto text-sm text-warm-gray hover:text-charcoal transition-colors"
            >
              <Info className="w-4 h-4" />
              BCS Guide
            </button>

            <span className="text-sm text-warm-gray">
              {filtered.length} of {statuses.length} animals
            </span>
          </div>

          {/* BCS Guide panel */}
          {showBcsGuide && (
            <div className="bg-white rounded-xl border border-card-border p-5">
              <h3 className="font-bold text-charcoal mb-3">Body Condition Score — Donkey Scale</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {bcsGuide.map((g) => (
                  <div
                    key={g.score}
                    className={`rounded-lg border p-3 ${bcsColor(g.score)}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold">{g.score}</span>
                      <span className="font-semibold text-sm">{g.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-80">{g.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════ TABLE ══════ */}
      {!batchMode && (
        <>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-card-border p-12 text-center">
              <Scale className="w-10 h-10 text-warm-gray/30 mx-auto mb-3" />
              <p className="text-warm-gray font-medium">No animals match your filters</p>
              <p className="text-sm text-warm-gray/60 mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-card-border overflow-hidden">
              {/* Table header */}
              <div className="hidden lg:grid grid-cols-[1fr_80px_80px_64px_80px_100px_80px_28px] gap-4 px-5 py-3 border-b border-card-border bg-cream/50">
                <SortHeader field="animal" label="Animal" />
                <SortHeader field="weight" label="Weight" />
                <SortHeader field="change" label="Change" />
                <SortHeader field="bcs" label="BCS" />
                <SortHeader field="trend" label="Trend" />
                <SortHeader field="flag" label="Status" />
                <SortHeader field="lastWeighIn" label="Last" />
                <span />
              </div>

              {/* Rows */}
              <div className="divide-y divide-card-border">
                {filtered.map((s) => {
                  const isExpanded = expandedAnimal === s.animal;
                  return (
                    <div key={s.animal}>
                      {/* Main row */}
                      <button
                        onClick={() => setExpandedAnimal(isExpanded ? null : s.animal)}
                        className="w-full grid grid-cols-2 lg:grid-cols-[1fr_80px_80px_64px_80px_100px_80px_28px] gap-x-4 gap-y-1 px-5 py-3 text-left hover:bg-cream/30 transition-colors items-center"
                      >
                        {/* Name + herd */}
                        <div className="min-w-0">
                          <Link
                            href={`/app/animals/${slugify(s.animal)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-semibold text-charcoal hover:text-sky-700 transition-colors"
                          >
                            {s.animal}
                          </Link>
                          <span className="text-xs text-warm-gray ml-2 hidden sm:inline">{s.herd}</span>
                        </div>

                        {/* Weight */}
                        <span className="text-sm font-medium text-charcoal tabular-nums">
                          {s.lastWeighIn?.weight ? `${s.lastWeighIn.weight}` : "—"}
                          {s.lastWeighIn?.weight && (
                            <span className="text-warm-gray/60 text-xs ml-0.5">lb</span>
                          )}
                        </span>

                        {/* Change */}
                        <span className="text-sm tabular-nums hidden lg:block">
                          {s.weightChangePct !== null ? (
                            <span className={s.weightChangePct > 0 ? "text-emerald-600" : s.weightChangePct < 0 ? "text-red-600" : "text-warm-gray"}>
                              {s.weightChangePct > 0 ? "+" : ""}
                              {s.weightChangePct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-warm-gray/40">—</span>
                          )}
                        </span>

                        {/* BCS */}
                        <span className="hidden lg:block">
                          <BcsBadge score={s.lastBcs} />
                        </span>

                        {/* Trend */}
                        <span className="hidden lg:block">
                          <TrendIcon trend={s.trend} />
                        </span>

                        {/* Flag */}
                        <span className="hidden lg:block">
                          <FlagBadge flag={s.flag} />
                          {s.flag === "normal" && (
                            <span className="text-xs text-emerald-600 font-medium">Normal</span>
                          )}
                        </span>

                        {/* Last weigh-in date */}
                        <span className="text-xs text-warm-gray hidden lg:block">
                          {s.lastWeighIn ? formatDate(s.lastWeighIn.date) : "Never"}
                        </span>

                        {/* Expand indicator */}
                        <ChevronRight
                          className={`w-4 h-4 text-warm-gray/40 transition-transform hidden lg:block ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />

                        {/* Mobile: second row with badges */}
                        <div className="col-span-2 flex items-center gap-2 flex-wrap lg:hidden">
                          <BcsBadge score={s.lastBcs} />
                          <TrendIcon trend={s.trend} />
                          <FlagBadge flag={s.flag} />
                          {s.lastWeighIn && (
                            <span className="text-xs text-warm-gray">
                              {formatDate(s.lastWeighIn.date)}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-5 pb-4 bg-cream/20 border-t border-card-border">
                          <div className="grid sm:grid-cols-2 gap-6 py-4">
                            {/* Sparkline + history */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-3">
                                Weight History
                              </h4>
                              <div className="mb-3">
                                <Sparkline history={s.history} />
                              </div>
                              <div className="space-y-1.5">
                                {s.history.slice(0, 6).map((h) => (
                                  <div
                                    key={h.id}
                                    className="flex items-center gap-3 text-sm"
                                  >
                                    <span className="text-xs text-warm-gray w-16 shrink-0">
                                      {formatDate(h.date)}
                                    </span>
                                    <span className="font-medium text-charcoal tabular-nums w-14">
                                      {h.weight ? `${h.weight} lb` : "—"}
                                    </span>
                                    {h.bcs && <BcsBadge score={h.bcs} />}
                                    {h.notes && (
                                      <span className="text-xs text-warm-gray italic truncate">
                                        {h.notes}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-warm-gray/50 ml-auto">
                                      {h.recordedBy}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Config + meta */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-3">
                                Monitoring Config
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-warm-gray">Weigh-in interval</span>
                                  <span className="font-medium text-charcoal">
                                    Every {s.config.weighInIntervalDays} days
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-warm-gray">Target BCS range</span>
                                  <span className="font-medium text-charcoal">
                                    {s.config.targetBcsMin}–{s.config.targetBcsMax}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-warm-gray">Alert threshold</span>
                                  <span className="font-medium text-charcoal">
                                    {s.config.alertThresholdPct}% change
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-warm-gray">Days since last weigh-in</span>
                                  <span className={`font-medium ${
                                    s.flag === "overdue" ? "text-red-600" : "text-charcoal"
                                  }`}>
                                    {s.daysSinceWeighIn ?? "Never weighed"}
                                    {s.flag === "overdue" && " (overdue)"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-warm-gray">Herd</span>
                                  <span className="font-medium text-charcoal">{s.herd}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
