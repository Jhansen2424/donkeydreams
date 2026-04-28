"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Footprints,
  Search,
  AlertTriangle,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  X,
  Zap,
  CalendarDays,
  Phone,
  Trash2,
} from "lucide-react";
import {
  computeAnimalCareStatuses,
  getHoofDentalStats,
  statusMeta,
  visitHistory as initialVisitHistory,
  type AnimalCareStatus,
  type CareVisit,
  type VisitStatus,
  type CareType,
} from "@/lib/hoof-dental-data";
import { getTrimProfile, type TrimProfile } from "@/lib/trimming-data";
import TrimPhotos from "@/components/app/TrimPhotos";
import ProviderPanel from "@/components/app/ProviderPanel";
import { useProviders } from "@/lib/providers-context";
import { formatDate as sharedFormatDate } from "@/lib/format-date";

type CareTab = "both" | "hoof" | "dental";
type SortField = "animal" | "herd" | "hoofStatus" | "dentalStatus" | "nextHoofDue" | "nextDentalDue";
type SortDir = "asc" | "desc";
type FilterStatus = VisitStatus | "all";

const statusOrder: Record<VisitStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  "no-history": 2,
  good: 3,
};

export default function HoofDentalPageWrapper() {
  return (
    <Suspense>
      <HoofDentalPage />
    </Suspense>
  );
}

interface ApiVisit {
  id: string;
  animal: string;
  date: string;
  provider: string;
  notes: string;
}

function HoofDentalPage() {
  // ── State ──
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as CareTab) || "both";
  // DB-backed visits only. Seed data stays in `initialVisitHistory` (CSV
  // imports) and is merged inside computeAnimalCareStatuses.
  const [dbHoofVisits, setDbHoofVisits] = useState<CareVisit[]>([]);
  const [dbDentalVisits, setDbDentalVisits] = useState<CareVisit[]>([]);
  const [dbNextHoofDue, setDbNextHoofDue] = useState<Record<string, string | null>>({});
  const [dbNextDentalDue, setDbNextDentalDue] = useState<Record<string, string | null>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  // Keep the variable name `visits` as the merged view so downstream render
  // code (expanded history sections, edit modals) works unchanged.
  const visits = useMemo(
    () => [...initialVisitHistory, ...dbHoofVisits, ...dbDentalVisits],
    [dbHoofVisits, dbDentalVisits]
  );

  const reloadVisits = useCallback(async () => {
    try {
      const [hoofRes, dentalRes] = await Promise.all([
        fetch("/api/hoof-visits", { cache: "no-store" }),
        fetch("/api/dental-visits", { cache: "no-store" }),
      ]);
      if (!hoofRes.ok) throw new Error("Failed to load hoof visits");
      if (!dentalRes.ok) throw new Error("Failed to load dental visits");
      const hoofBody = (await hoofRes.json()) as { entries: ApiVisit[]; nextDue: Record<string, string | null> };
      const dentalBody = (await dentalRes.json()) as { entries: ApiVisit[]; nextDue: Record<string, string | null> };

      setDbHoofVisits(
        hoofBody.entries.map((e) => ({
          id: e.id,
          animal: e.animal,
          type: "hoof" as CareType,
          date: e.date,
          provider: e.provider,
          notes: e.notes,
        }))
      );
      setDbDentalVisits(
        dentalBody.entries.map((e) => ({
          id: e.id,
          animal: e.animal,
          type: "dental" as CareType,
          date: e.date,
          provider: e.provider,
          notes: e.notes,
        }))
      );
      setDbNextHoofDue(hoofBody.nextDue || {});
      setDbNextDentalDue(dentalBody.nextDue || {});
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load visits");
    }
  }, []);

  useEffect(() => {
    void reloadVisits();
  }, [reloadVisits]);

  const { providers, add: addProviderToDb, remove: removeProviderFromDb } =
    useProviders();
  const [careTab, setCareTab] = useState<CareTab>(initialTab);

  // Sync tab with URL params when navigating from sidebar
  useEffect(() => {
    const tabParam = searchParams.get("tab") as CareTab | null;
    if (tabParam && ["hoof", "dental", "both"].includes(tabParam)) {
      setCareTab(tabParam);
    }
  }, [searchParams]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("hoofStatus");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null);
  const [logModalAnimal, setLogModalAnimal] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<CareVisit | null>(null);
  const [editingInterval, setEditingInterval] = useState<string | null>(null);
  const [showProviderPanel, setShowProviderPanel] = useState(false);

  // Editable intervals (per-animal overrides)
  const [intervalOverrides, setIntervalOverrides] = useState<
    Record<string, { hoofWeeks?: number; dentalMonths?: number }>
  >({});

  // Manual "next due" dates — let the user set the next trim / dental date
  // directly, even when no visit history exists yet. Keyed by animal name.
  const [nextDueOverrides, setNextDueOverrides] = useState<
    Record<string, { nextHoofDue?: string; nextDentalDue?: string }>
  >({});

  // ── Derived data ──
  const statuses = useMemo(() => {
    // Merge the DB-backed next-due dates with any unsaved user overrides (the
    // user can still tweak dates inline without waiting for the API roundtrip).
    const nextDueByAnimal: Record<string, { nextHoofDue?: string | null; nextDentalDue?: string | null }> = {};
    const animalNames = new Set([
      ...Object.keys(dbNextHoofDue),
      ...Object.keys(dbNextDentalDue),
      ...Object.keys(nextDueOverrides),
    ]);
    for (const name of animalNames) {
      nextDueByAnimal[name] = {
        nextHoofDue:
          nextDueOverrides[name]?.nextHoofDue ?? dbNextHoofDue[name] ?? null,
        nextDentalDue:
          nextDueOverrides[name]?.nextDentalDue ?? dbNextDentalDue[name] ?? null,
      };
    }

    const base = computeAnimalCareStatuses({
      extraVisits: [...dbHoofVisits, ...dbDentalVisits],
      nextDueByAnimal,
    });

    return base.map((s) => {
      const intervalOverride = intervalOverrides[s.animal];
      return {
        ...s,
        hoofInterval: intervalOverride?.hoofWeeks ?? s.hoofInterval,
        dentalInterval: intervalOverride?.dentalMonths ?? s.dentalInterval,
      };
    });
  }, [dbHoofVisits, dbDentalVisits, dbNextHoofDue, dbNextDentalDue, intervalOverrides, nextDueOverrides]);

  const stats = useMemo(() => getHoofDentalStats(), [visits]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let list = statuses;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.animal.toLowerCase().includes(q) ||
          s.herd.toLowerCase().includes(q) ||
          s.hoofNotes.toLowerCase().includes(q) ||
          s.dentalNotes.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      list = list.filter(
        (s) => s.hoofStatus === filterStatus || s.dentalStatus === filterStatus
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "animal":
          cmp = a.animal.localeCompare(b.animal);
          break;
        case "herd":
          cmp = a.herd.localeCompare(b.herd);
          break;
        case "hoofStatus":
          cmp = statusOrder[a.hoofStatus] - statusOrder[b.hoofStatus];
          break;
        case "dentalStatus":
          cmp = statusOrder[a.dentalStatus] - statusOrder[b.dentalStatus];
          break;
        case "nextHoofDue":
          cmp = (a.nextHoofDue ?? "9999").localeCompare(b.nextHoofDue ?? "9999");
          break;
        case "nextDentalDue":
          cmp = (a.nextDentalDue ?? "9999").localeCompare(b.nextDentalDue ?? "9999");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [statuses, search, filterStatus, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Quick log handler ──
  // POST a visit to the right endpoint. If the user also supplied a next-due
  // date, the API will update the Animal record atomically.
  const logVisit = async (
    visit: Omit<CareVisit, "id"> & { nextDue?: string | null }
  ) => {
    const url = visit.type === "hoof" ? "/api/hoof-visits" : "/api/dental-visits";
    const nextField = visit.type === "hoof" ? "nextHoofDue" : "nextDentalDue";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal: visit.animal,
          date: visit.date,
          provider: visit.provider,
          notes: visit.notes,
          [nextField]: visit.nextDue ?? undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save visit");
      await reloadVisits();
      setLogModalAnimal(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to save visit");
    }
  };

  // ── Edit visit handler ──
  const updateVisit = async (updated: CareVisit) => {
    // Only DB-backed visits are editable. Seed CSV visits have short numeric
    // ids and don't round-trip to any endpoint.
    const isDbVisit =
      dbHoofVisits.some((v) => v.id === updated.id) ||
      dbDentalVisits.some((v) => v.id === updated.id);
    if (!isDbVisit) {
      setEditingVisit(null);
      return;
    }
    const url = updated.type === "hoof" ? "/api/hoof-visits" : "/api/dental-visits";
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updated.id,
          date: updated.date,
          provider: updated.provider,
          notes: updated.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update visit");
      await reloadVisits();
      setEditingVisit(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to update visit");
    }
  };

  const deleteVisit = async (id: string) => {
    // Detect which endpoint based on which list the visit came from.
    const isHoof = dbHoofVisits.some((v) => v.id === id);
    const isDental = dbDentalVisits.some((v) => v.id === id);
    if (!isHoof && !isDental) return; // seed visit — can't delete
    const url = isHoof ? "/api/hoof-visits" : "/api/dental-visits";
    try {
      const res = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete visit");
      await reloadVisits();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to delete visit");
    }
  };

  // ── Update interval ──
  const updateInterval = (animal: string, field: "hoofWeeks" | "dentalMonths", value: number) => {
    setIntervalOverrides((prev) => ({
      ...prev,
      [animal]: { ...prev[animal], [field]: value },
    }));
  };

  // ── Update next-due date directly (bypasses interval math) ──
  // Optimistically updates the override map so the cell re-renders
  // instantly, then persists via the API so the date survives reloads.
  const updateNextDue = async (
    animal: string,
    field: "nextHoofDue" | "nextDentalDue",
    value: string | null
  ) => {
    setNextDueOverrides((prev) => {
      const next = { ...prev[animal], [field]: value ?? undefined };
      return { ...prev, [animal]: next };
    });
    const url = field === "nextHoofDue" ? "/api/hoof-visits" : "/api/dental-visits";
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal, [field]: value ?? "" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update next-due");
      await reloadVisits();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to update next-due date");
    }
  };

  // ── Add / remove provider (persisted via context → /api/providers) ──
  const addProvider = (p: { name: string; type: string; phone: string }) => {
    void addProviderToDb(p);
  };

  const removeProvider = (name: string) => {
    const target = providers.find((p) => p.name === name);
    if (target) void removeProviderFromDb(target.id);
  };

  return (
    <div className="space-y-6">
      {/* Header — title adapts to the tab so "Hoof Care" and "Dental Care"
          sidebar entries each feel like their own page, even though they
          share this component. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <Footprints className="w-6 h-6 text-sky" />
            {careTab === "hoof"
              ? "Hoof Care"
              : careTab === "dental"
                ? "Dental Care"
                : "Hoof & Dental Care"}
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {careTab === "hoof"
              ? "Track trims and farrier visits for every donkey"
              : careTab === "dental"
                ? "Track dental floats and equine dentist visits for every donkey"
                : "Track trims, floats, and provider visits for every donkey"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProviderPanel(!showProviderPanel)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
          >
            <Phone className="w-4 h-4" />
            Providers
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Care type tabs */}
      <div className="inline-flex bg-white border border-card-border rounded-lg overflow-hidden">
        {([
          { id: "both" as CareTab, label: "Both" },
          { id: "hoof" as CareTab, label: "Hoof Care" },
          { id: "dental" as CareTab, label: "Dental Care" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCareTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              careTab === tab.id
                ? "bg-sidebar text-white"
                : "text-charcoal hover:bg-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stat cards — click "Overdue" / "Due This Week" to filter the table */}
      <div className={`grid ${careTab === "both" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3"} gap-4`}>
        {careTab !== "dental" && (
          <StatCard
            label="Hoof Overdue"
            value={stats.hoofOverdue}
            subtitle={`${stats.hoofDueSoon} due soon`}
            urgent={stats.hoofOverdue > 0}
            active={filterStatus === "overdue"}
            onClick={() => setFilterStatus((cur) => (cur === "overdue" ? "all" : "overdue"))}
          />
        )}
        {careTab !== "hoof" && (
          <StatCard
            label="Dental Overdue"
            value={stats.dentalOverdue}
            subtitle={`${stats.dentalDueSoon} due soon`}
            urgent={stats.dentalOverdue > 0}
            active={filterStatus === "overdue"}
            onClick={() => setFilterStatus((cur) => (cur === "overdue" ? "all" : "overdue"))}
          />
        )}
        <StatCard
          label="Due This Week"
          value={stats.dueThisWeek}
          subtitle={careTab === "both" ? "Hoof or dental" : careTab === "hoof" ? "Hoof trims" : "Dental visits"}
          urgent={false}
          active={filterStatus === "due-soon"}
          onClick={() => setFilterStatus((cur) => (cur === "due-soon" ? "all" : "due-soon"))}
        />
        {careTab !== "dental" && (
          <StatCard
            label="Next Farrier Visit"
            value={stats.nextFarrierVisit ? formatDate(stats.nextFarrierVisit) : "—"}
            subtitle={
              stats.nextFarrierVisit
                ? `${daysDiff(new Date().toISOString().split("T")[0], stats.nextFarrierVisit)} days`
                : "No upcoming"
            }
            urgent={false}
            isDate
          />
        )}
      </div>

      {/* Provider panel (collapsible) */}
      {showProviderPanel && (
        <ProviderPanel
          providers={providers}
          onAdd={addProvider}
          onRemove={removeProvider}
          onClose={() => setShowProviderPanel(false)}
        />
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
          <input
            type="text"
            placeholder="Search donkey, herd, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray/50 hover:text-charcoal">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "overdue", "due-soon", "good", "no-history"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === s
                  ? "bg-sidebar text-white border-sidebar"
                  : "bg-white text-charcoal border-card-border hover:bg-cream"
              }`}
            >
              {s !== "all" && <span className={`w-2 h-2 rounded-full ${statusMeta[s as VisitStatus].dot}`} />}
              {s === "all" ? "All" : statusMeta[s as VisitStatus].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-warm-gray ml-auto">
          {filtered.length} animal{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Animal table */}
      <div className="bg-white rounded-xl border border-card-border overflow-hidden">
        {/* Table header */}
        <div className={`hidden sm:grid gap-2 px-5 py-3 bg-cream/50 border-b border-card-border text-[11px] font-semibold uppercase tracking-wider text-warm-gray ${
          careTab === "both"
            ? "sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto]"
            : "sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
        }`}>
          <SortHeader label="Donkey" field="animal" current={sortField} dir={sortDir} onSort={toggleSort} />
          <SortHeader label="Herd" field="herd" current={sortField} dir={sortDir} onSort={toggleSort} />
          {careTab !== "dental" && (
            <SortHeader label="Hoof Status" field="hoofStatus" current={sortField} dir={sortDir} onSort={toggleSort} />
          )}
          {careTab !== "dental" && (
            <SortHeader label="Next Trim" field="nextHoofDue" current={sortField} dir={sortDir} onSort={toggleSort} />
          )}
          {careTab !== "hoof" && (
            <SortHeader label="Dental Status" field="dentalStatus" current={sortField} dir={sortDir} onSort={toggleSort} />
          )}
          {careTab !== "hoof" && (
            <SortHeader label="Next Dental" field="nextDentalDue" current={sortField} dir={sortDir} onSort={toggleSort} />
          )}
          <span>Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-card-border">
          {filtered.map((animal) => (
            <AnimalRow
              key={animal.animal}
              status={animal}
              careTab={careTab}
              visits={visits.filter((v) => v.animal === animal.animal)}
              expanded={expandedAnimal === animal.animal}
              onToggleExpand={() =>
                setExpandedAnimal(expandedAnimal === animal.animal ? null : animal.animal)
              }
              onQuickLog={() => setLogModalAnimal(animal.animal)}
              onEditVisit={setEditingVisit}
              onDeleteVisit={deleteVisit}
              onEditInterval={(field, value) => updateInterval(animal.animal, field, value)}
              editingInterval={editingInterval}
              setEditingInterval={setEditingInterval}
              intervalOverrides={intervalOverrides[animal.animal]}
              onEditNextDue={(field, value) => updateNextDue(animal.animal, field, value)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-warm-gray/50">
              No animals match your search
            </div>
          )}
        </div>
      </div>

      {/* Quick-Log Modal */}
      {logModalAnimal && (
        <QuickLogModal
          animal={logModalAnimal}
          providers={providers}
          onLog={logVisit}
          onClose={() => setLogModalAnimal(null)}
        />
      )}

      {/* Edit Visit Modal */}
      {editingVisit && (
        <EditVisitModal
          visit={editingVisit}
          providers={providers}
          onSave={updateVisit}
          onClose={() => setEditingVisit(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ── Stat Card
// ══════════════════════════════════════════
function StatCard({
  label,
  value,
  subtitle,
  urgent,
  isDate,
  onClick,
  active,
}: {
  label: string;
  value: number | string;
  subtitle: string;
  urgent: boolean;
  isDate?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const classes = `rounded-xl border p-4 text-left transition-all ${
    active
      ? "bg-sidebar text-white border-sidebar"
      : urgent
      ? "bg-red-50 border-red-200"
      : "bg-white border-card-border"
  } ${onClick ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""}`;

  const labelCls = `text-xs font-semibold uppercase tracking-wider ${
    active ? "text-white/90" : urgent ? "text-red-600" : "text-warm-gray"
  }`;
  const valueCls = `text-2xl font-bold mt-1 ${
    active ? "text-white" : urgent ? "text-red-700" : isDate ? "text-base text-charcoal" : "text-charcoal"
  }`;
  const subtitleCls = `text-xs mt-0.5 ${
    active ? "text-white/80" : urgent ? "text-red-600/70" : "text-warm-gray/70"
  }`;

  const content = (
    <>
      <p className={labelCls}>{label}</p>
      <p className={valueCls}>{value}</p>
      <p className={subtitleCls}>{subtitle}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}

// ══════════════════════════════════════════
// ── Sort Header
// ══════════════════════════════════════════
function SortHeader({
  label,
  field,
  current,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-charcoal transition-colors text-left">
      {label}
      {current === field && (dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </button>
  );
}

// ══════════════════════════════════════════
// ── Next Due cell — shows the date + a pencil that opens a date input
// ══════════════════════════════════════════
function NextDueCell({
  value,
  days,
  onSave,
}: {
  value: string | null;
  days: number | null;
  onSave: (v: string | null) => void;
}) {
  const todayIso = new Date().toISOString().split("T")[0];
  const [editing, setEditing] = useState(false);
  // When the cell has no saved date yet, prefill the editor with today's
  // date so staff aren't typing a date from scratch — the common case is
  // "schedule the next trim about now."
  const [draft, setDraft] = useState(value ?? todayIso);
  useEffect(() => {
    setDraft(value ?? todayIso);
  }, [value, todayIso]);

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="px-2 py-1 text-xs border border-card-border rounded-md text-charcoal focus:outline-none focus:ring-1 focus:ring-sand"
          autoFocus
        />
        <button
          onClick={() => {
            onSave(draft || null);
            setEditing(false);
          }}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
          title="Save"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setDraft(value ?? "");
            setEditing(false);
          }}
          className="p-1 text-warm-gray hover:bg-cream rounded-md"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-charcoal">
      {value ? (
        <>
          {formatDate(value)}
          <DaysLabel days={days} />
        </>
      ) : (
        <span className="text-warm-gray/50">—</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="p-1 text-warm-gray/60 hover:text-sidebar hover:bg-cream rounded-md"
        title="Set next date"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </span>
  );
}

// ══════════════════════════════════════════
// ── Status Badge
// ══════════════════════════════════════════
function StatusBadge({ status }: { status: VisitStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// ══════════════════════════════════════════
// ── Animal Row (expandable)
// ══════════════════════════════════════════
function AnimalRow({
  status,
  careTab,
  visits,
  expanded,
  onToggleExpand,
  onQuickLog,
  onEditVisit,
  onDeleteVisit,
  onEditInterval,
  editingInterval,
  setEditingInterval,
  intervalOverrides,
  onEditNextDue,
}: {
  status: AnimalCareStatus;
  careTab: CareTab;
  visits: CareVisit[];
  expanded: boolean;
  onToggleExpand: () => void;
  onQuickLog: () => void;
  onEditVisit: (v: CareVisit) => void;
  onDeleteVisit: (id: string) => void;
  onEditInterval: (field: "hoofWeeks" | "dentalMonths", value: number) => void;
  editingInterval: string | null;
  setEditingInterval: (v: string | null) => void;
  intervalOverrides?: { hoofWeeks?: number; dentalMonths?: number };
  onEditNextDue?: (field: "nextHoofDue" | "nextDentalDue", value: string | null) => void;
}) {
  const hoofVisits = visits.filter((v) => v.type === "hoof").sort((a, b) => b.date.localeCompare(a.date));
  const dentalVisits = visits.filter((v) => v.type === "dental").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {/* Main row */}
      <div
        className={`grid grid-cols-[1fr_auto] gap-2 px-5 py-3 items-center hover:bg-cream/30 transition-colors cursor-pointer ${
          careTab === "both"
            ? "sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_auto]"
            : "sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
        }`}
        onClick={onToggleExpand}
      >
        {/* Name */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-charcoal">{status.animal}</span>
          {(status.hoofNotes || status.dentalNotes) && (
            <Zap className="w-3 h-3 text-amber-500" />
          )}
        </div>
        {/* Herd (hidden mobile) */}
        <span className="hidden sm:block text-sm text-warm-gray">{status.herd}</span>
        {/* Hoof status */}
        {careTab !== "dental" && (
          <div className="hidden sm:block">
            <StatusBadge status={status.hoofStatus} />
          </div>
        )}
        {/* Next trim — inline-editable */}
        {careTab !== "dental" && (
          <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
            <NextDueCell
              value={status.nextHoofDue}
              days={status.daysUntilHoof}
              onSave={(v) => onEditNextDue?.("nextHoofDue", v)}
            />
          </div>
        )}
        {/* Dental status */}
        {careTab !== "hoof" && (
          <div className="hidden sm:block">
            <StatusBadge status={status.dentalStatus} />
          </div>
        )}
        {/* Next dental — inline-editable */}
        {careTab !== "hoof" && (
          <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
            <NextDueCell
              value={status.nextDentalDue}
              days={status.daysUntilDental}
              onSave={(v) => onEditNextDue?.("nextDentalDue", v)}
            />
          </div>
        )}
        {/* Actions */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onQuickLog}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky text-white text-xs font-semibold rounded-lg hover:bg-sky-dark transition-colors"
          >
            <Plus className="w-3 h-3" />
            Log
          </button>
          <button onClick={onToggleExpand} className="p-1.5 text-warm-gray hover:text-charcoal">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile summary (below name) */}
        <div className="sm:hidden col-span-2 flex flex-wrap gap-2 mt-1">
          {careTab !== "dental" && <StatusBadge status={status.hoofStatus} />}
          {careTab !== "hoof" && <StatusBadge status={status.dentalStatus} />}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-5 pb-4 bg-cream/20 border-t border-card-border">
          <div className={`grid ${careTab === "both" ? "sm:grid-cols-2" : ""} gap-6 py-4`}>
            {/* Hoof section */}
            {careTab !== "dental" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-charcoal flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-sky" /> Hoof Trims
                  </h3>
                  <EditableInterval
                    label="Every"
                    value={intervalOverrides?.hoofWeeks ?? status.hoofInterval}
                    unit="weeks"
                    editing={editingInterval === `${status.animal}-hoof`}
                    onStartEdit={() => setEditingInterval(`${status.animal}-hoof`)}
                    onSave={(v) => {
                      onEditInterval("hoofWeeks", v);
                      setEditingInterval(null);
                    }}
                    onCancel={() => setEditingInterval(null)}
                  />
                </div>
                {status.hoofNotes && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {status.hoofNotes}
                  </p>
                )}
                <TrimProfileBlock animalName={status.animal} />
                <VisitList visits={hoofVisits} onEdit={onEditVisit} onDelete={onDeleteVisit} />
              </div>
            )}

            {/* Dental section */}
            {careTab !== "hoof" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-charcoal flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-sky" /> Dental Visits
                  </h3>
                  <EditableInterval
                    label="Every"
                    value={intervalOverrides?.dentalMonths ?? status.dentalInterval}
                    unit="months"
                    editing={editingInterval === `${status.animal}-dental`}
                    onStartEdit={() => setEditingInterval(`${status.animal}-dental`)}
                    onSave={(v) => {
                      onEditInterval("dentalMonths", v);
                      setEditingInterval(null);
                    }}
                    onCancel={() => setEditingInterval(null)}
                  />
                </div>
                {status.dentalNotes && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {status.dentalNotes}
                  </p>
                )}
                <VisitList visits={dentalVisits} onEdit={onEditVisit} onDelete={onDeleteVisit} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ── Editable Interval (inline)
// ══════════════════════════════════════════
function EditableInterval({
  label,
  value,
  unit,
  editing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  label: string;
  value: number;
  unit: string;
  editing: boolean;
  onStartEdit: () => void;
  onSave: (v: number) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-warm-gray">{label}</span>
        <input
          type="number"
          min={1}
          max={52}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          autoFocus
          className="w-14 px-2 py-1 text-xs border border-sky rounded text-charcoal focus:outline-none focus:ring-1 focus:ring-sky"
        />
        <span className="text-xs text-warm-gray">{unit}</span>
        <button onClick={() => onSave(draft)} className="p-1 text-emerald-600 hover:text-emerald-700">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onCancel} className="p-1 text-warm-gray hover:text-charcoal">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={onStartEdit} className="flex items-center gap-1 text-xs text-warm-gray hover:text-charcoal group">
      {label} {value} {unit}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ══════════════════════════════════════════
// ── Trim Profile Block — durable per-donkey trim guidance
// ══════════════════════════════════════════
function TrimProfileBlock({ animalName }: { animalName: string }) {
  const profile: TrimProfile | null = getTrimProfile(animalName);
  if (!profile) return null;

  const {
    lastTrim,
    preTrimTreatment,
    protocols,
    squishPads,
    recentNotes,
    trainingDate,
    trainingNotes,
  } = profile;

  const hasTrimInfo =
    preTrimTreatment || protocols || squishPads || recentNotes || lastTrim;
  const hasTraining = trainingDate || trainingNotes;

  if (!hasTrimInfo && !hasTraining) return null;

  return (
    <div className="space-y-2">
      {lastTrim && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-warm-gray/70">
            Last Trim
          </span>
          <span className="text-charcoal font-medium">
            {formatDate(lastTrim)}
          </span>
        </div>
      )}
      {protocols && (
        <TrimProfileField label="Trimming Protocols" value={protocols} />
      )}
      {preTrimTreatment && (
        <TrimProfileField label="Pre-Trim Treatment" value={preTrimTreatment} />
      )}
      {squishPads && (
        <TrimProfileField label="Squish Pads" value={squishPads} />
      )}
      {recentNotes && (
        <TrimProfileField label="Notes from Recent Trim" value={recentNotes} />
      )}
      {hasTraining && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700/80">
              Training Progress
            </p>
            {trainingDate && (
              <p className="text-[10px] text-sky-700/70">
                Last session: {formatDate(trainingDate)}
              </p>
            )}
          </div>
          {trainingNotes && (
            <p className="text-xs text-charcoal leading-relaxed">
              {trainingNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TrimProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-card-border rounded-lg px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
        {label}
      </p>
      <p className="text-xs text-charcoal leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════
// ── Visit List (with edit/delete)
// ══════════════════════════════════════════
function VisitList({
  visits,
  onEdit,
  onDelete,
}: {
  visits: CareVisit[];
  onEdit: (v: CareVisit) => void;
  onDelete: (id: string) => void;
}) {
  if (visits.length === 0) {
    return <p className="text-xs text-warm-gray/50 italic">No visits recorded</p>;
  }

  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto">
      {visits.slice(0, 5).map((v) => (
        <div
          key={v.id}
          className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-card-border group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-charcoal">{formatDate(v.date)}</span>
              <span className="text-[10px] text-warm-gray">· {v.provider}</span>
            </div>
            <p className="text-xs text-warm-gray mt-0.5 truncate">{v.notes}</p>
            {/* Photos: same TrimPhotos component used on the per-animal
                trim history. Works for both hoof and dental since storage
                is keyed by any string id. */}
            <TrimPhotos visitId={v.id} />
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(v)} className="p-1 text-warm-gray hover:text-sky">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(v.id)} className="p-1 text-warm-gray hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
      {visits.length > 5 && (
        <p className="text-[10px] text-warm-gray/50 text-center">+ {visits.length - 5} older visits</p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ── Days Label (inline helper)
// ══════════════════════════════════════════
function DaysLabel({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return <span className="text-[10px] text-red-600 font-semibold ml-1">{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="text-[10px] text-amber-600 font-semibold ml-1">Today</span>;
  if (days <= 7) return <span className="text-[10px] text-amber-600 font-semibold ml-1">{days}d</span>;
  return <span className="text-[10px] text-warm-gray ml-1">{days}d</span>;
}

// ══════════════════════════════════════════
// ── Quick Log Modal (fast entry)
// ══════════════════════════════════════════
function QuickLogModal({
  animal,
  providers,
  onLog,
  onClose,
}: {
  animal: string;
  providers: { name: string; type: string }[];
  onLog: (v: Omit<CareVisit, "id"> & { nextDue?: string | null }) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [type, setType] = useState<CareType>("hoof");
  const [date, setDate] = useState(today);
  const [provider, setProvider] = useState(providers[0]?.name ?? "");
  const [notes, setNotes] = useState("");
  const [nextDue, setNextDue] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-sidebar px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white">Log Visit — {animal}</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["hoof", "dental"] as CareType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  type === t
                    ? "bg-sky text-white"
                    : "bg-cream text-charcoal hover:bg-sand/30"
                }`}
              >
                {t === "hoof" ? "Hoof Trim" : "Dental Float"}
              </button>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/50"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/50 bg-white"
            >
              {providers.map((p) => (
                <option key={p.name} value={p.name}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>

          {/* Next treatment — prompted per the change list so a next
              date is always recorded alongside the visit. */}
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">
              Next {type === "hoof" ? "Trim" : "Dental"} Date
            </label>
            <input
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condition, issues found, follow-up needed..."
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/40 focus:outline-none focus:ring-2 focus:ring-sky/50 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={() =>
              onLog({
                animal,
                type,
                date,
                provider,
                notes: notes || "Routine visit.",
                nextDue: nextDue || null,
              })
            }
            className="w-full py-3 bg-sky text-white font-bold rounded-lg hover:bg-sky-dark transition-colors"
          >
            <Check className="w-4 h-4 inline mr-1.5" />
            Log {type === "hoof" ? "Trim" : "Dental"} Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ── Edit Visit Modal
// ══════════════════════════════════════════
function EditVisitModal({
  visit,
  providers,
  onSave,
  onClose,
}: {
  visit: CareVisit;
  providers: { name: string; type: string }[];
  onSave: (v: CareVisit) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(visit.date);
  const [provider, setProvider] = useState(visit.provider);
  const [notes, setNotes] = useState(visit.notes);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-sidebar px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white">
            Edit {visit.type === "hoof" ? "Hoof Trim" : "Dental Visit"} — {visit.animal}
          </h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/50 bg-white"
            >
              {providers.map((p) => (
                <option key={p.name} value={p.name}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-card-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/50 resize-none"
            />
          </div>
          <button
            onClick={() => onSave({ ...visit, date, provider, notes })}
            className="w-full py-3 bg-sky text-white font-bold rounded-lg hover:bg-sky-dark transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──
// Switched to MM-DD-YYYY per the dev team's "consistent date format" request.
function formatDate(iso: string): string {
  return sharedFormatDate(iso);
}

function daysDiff(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
}
