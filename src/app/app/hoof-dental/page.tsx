"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
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
  providers as defaultProviders,
  visitHistory as initialVisitHistory,
  type AnimalCareStatus,
  type CareVisit,
  type VisitStatus,
  type CareType,
} from "@/lib/hoof-dental-data";

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

function HoofDentalPage() {
  // ── State ──
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as CareTab) || "both";
  const [visits, setVisits] = useState<CareVisit[]>(initialVisitHistory);
  const [providers, setProviders] = useState(defaultProviders);
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
    const base = computeAnimalCareStatuses();
    const today = new Date().toISOString().split("T")[0];
    const daysBetween = (a: string, b: string) => {
      const d1 = new Date(a + "T00:00:00").getTime();
      const d2 = new Date(b + "T00:00:00").getTime();
      return Math.round((d2 - d1) / 86_400_000);
    };
    const getStatus = (days: number | null): VisitStatus => {
      if (days === null) return "no-history";
      if (days < 0) return "overdue";
      if (days <= 7) return "due-soon";
      return "good";
    };
    return base.map((s) => {
      const intervalOverride = intervalOverrides[s.animal];
      const nextOverride = nextDueOverrides[s.animal];
      let next = {
        nextHoofDue: s.nextHoofDue,
        nextDentalDue: s.nextDentalDue,
        daysUntilHoof: s.daysUntilHoof,
        daysUntilDental: s.daysUntilDental,
        hoofStatus: s.hoofStatus,
        dentalStatus: s.dentalStatus,
      };
      if (nextOverride?.nextHoofDue) {
        next.nextHoofDue = nextOverride.nextHoofDue;
        next.daysUntilHoof = daysBetween(today, nextOverride.nextHoofDue);
        next.hoofStatus = getStatus(next.daysUntilHoof);
      }
      if (nextOverride?.nextDentalDue) {
        next.nextDentalDue = nextOverride.nextDentalDue;
        next.daysUntilDental = daysBetween(today, nextOverride.nextDentalDue);
        next.dentalStatus = getStatus(next.daysUntilDental);
      }
      return {
        ...s,
        ...next,
        hoofInterval: intervalOverride?.hoofWeeks ?? s.hoofInterval,
        dentalInterval: intervalOverride?.dentalMonths ?? s.dentalInterval,
      };
    });
  }, [visits, intervalOverrides, nextDueOverrides]);

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
  // If the user supplied a next-due date alongside the visit, apply it as
  // an override so it shows up immediately in the table.
  const logVisit = (visit: Omit<CareVisit, "id"> & { nextDue?: string | null }) => {
    const { nextDue, ...rest } = visit;
    const newVisit: CareVisit = {
      ...rest,
      id: `${rest.type}-${Date.now()}`,
    };
    setVisits((prev) => [newVisit, ...prev]);
    if (nextDue) {
      updateNextDue(
        rest.animal,
        rest.type === "hoof" ? "nextHoofDue" : "nextDentalDue",
        nextDue
      );
    }
    setLogModalAnimal(null);
  };

  // ── Edit visit handler ──
  const updateVisit = (updated: CareVisit) => {
    setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setEditingVisit(null);
  };

  const deleteVisit = (id: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== id));
  };

  // ── Update interval ──
  const updateInterval = (animal: string, field: "hoofWeeks" | "dentalMonths", value: number) => {
    setIntervalOverrides((prev) => ({
      ...prev,
      [animal]: { ...prev[animal], [field]: value },
    }));
  };

  // ── Update next-due date directly (bypasses interval math) ──
  const updateNextDue = (
    animal: string,
    field: "nextHoofDue" | "nextDentalDue",
    value: string | null
  ) => {
    setNextDueOverrides((prev) => {
      const next = { ...prev[animal], [field]: value ?? undefined };
      return { ...prev, [animal]: next };
    });
  };

  // ── Add provider ──
  const addProvider = (p: (typeof providers)[0]) => {
    setProviders((prev) => [...prev, p]);
  };

  const removeProvider = (name: string) => {
    setProviders((prev) => prev.filter((p) => p.name !== name));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <Footprints className="w-6 h-6 text-sky" />
            Hoof & Dental Care
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            Track trims, floats, and provider visits for every donkey
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

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
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
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

// ══════════════════════════════════════════
// ── Provider Panel (editable)
// ══════════════════════════════════════════
function ProviderPanel({
  providers,
  onAdd,
  onRemove,
  onClose,
}: {
  providers: { name: string; type: string; phone: string }[];
  onAdd: (p: { name: string; type: "Farrier" | "Equine Dentist"; phone: string }) => void;
  onRemove: (name: string) => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"Farrier" | "Equine Dentist">("Farrier");
  const [phone, setPhone] = useState("");

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-charcoal flex items-center gap-2">
          <Phone className="w-4 h-4 text-sky" />
          Providers
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(!adding)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-sky text-white rounded-lg hover:bg-sky-dark transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          <button onClick={onClose} className="p-1.5 text-warm-gray hover:text-charcoal">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {adding && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-cream/50 rounded-lg border border-card-border">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="px-3 py-1.5 text-sm border border-card-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky"
          >
            <option>Farrier</option>
            <option>Equine Dentist</option>
          </select>
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky"
          />
          <button
            onClick={() => {
              if (name.trim()) {
                onAdd({ name: name.trim(), type, phone: phone.trim() });
                setName("");
                setPhone("");
                setAdding(false);
              }
            }}
            className="px-3 py-1.5 text-sm font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Save
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {providers.map((p) => (
          <div key={p.name} className="flex items-center gap-3 p-3 bg-cream/30 rounded-lg border border-card-border group">
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal">{p.name}</p>
              <p className="text-xs text-warm-gray">
                {p.type} · {p.phone}
              </p>
            </div>
            <button
              onClick={() => onRemove(p.name)}
              className="p-1 text-warm-gray hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──
function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysDiff(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
}
