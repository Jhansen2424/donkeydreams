"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Plus,
  X,
  AlertCircle,
  ChevronDown,
  Stethoscope,
} from "lucide-react";
import {
  allMedicalEntries as baseRecords,
  recordTypes,
  typeBadgeColors,
  type MedicalRecord,
  type MedicalRecordType,
} from "@/lib/medical-data";
import { animals } from "@/lib/animals";

type Tab = "upcoming" | "overdue" | "recent" | "all";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateGroup(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function TypeBadge({ type }: { type: MedicalRecordType }) {
  const colors = typeBadgeColors[type] || { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
    >
      {type}
    </span>
  );
}

function RecordCard({ record }: { record: MedicalRecord }) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
        record.urgent ? "border-red-200 bg-red-50/30" : "border-card-border"
      }`}
    >
      {record.urgent && (
        <AlertCircle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Link
            href={`/app/animals/${slugify(record.animal)}`}
            className="font-semibold text-charcoal text-sm hover:text-sky-700 transition-colors"
          >
            {record.animal}
          </Link>
          <TypeBadge type={record.type} />
          {record.urgent && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
              Urgent
            </span>
          )}
        </div>
        <p className="font-medium text-charcoal text-sm">{record.title}</p>
        <p className="text-xs text-warm-gray mt-0.5">{formatDate(record.date)}</p>
        {record.description && (
          <p className="text-sm text-warm-gray mt-2 leading-relaxed">
            {record.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MedicalDashboardPage() {
  const today = useMemo(() => new Date("2026-03-31"), []);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MedicalRecordType | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [localRecords, setLocalRecords] = useState<MedicalRecord[]>([]);

  // Add form state
  const [formAnimal, setFormAnimal] = useState(animals[0]?.name || "");
  const [formType, setFormType] = useState<MedicalRecordType>("Vet Visit");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("2026-03-31");
  const [formDesc, setFormDesc] = useState("");
  const [formUrgent, setFormUrgent] = useState(false);

  const allRecords = useMemo(
    () => [...baseRecords, ...localRecords],
    [localRecords]
  );

  // Stats
  const stats = useMemo(() => {
    const overdueCount = allRecords.filter((r) => {
      const d = new Date(r.date);
      return d < today && r.urgent;
    }).length;

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const dueThisWeek = allRecords.filter((r) => {
      const d = new Date(r.date);
      return d >= today && d <= weekFromNow;
    }).length;

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const completedThisMonth = allRecords.filter((r) => {
      const d = new Date(r.date);
      return d >= monthAgo && d <= today && !r.urgent;
    }).length;

    return {
      overdue: overdueCount,
      dueThisWeek,
      completedThisMonth,
      total: allRecords.length,
    };
  }, [allRecords, today]);

  // Filtered records based on tab
  const tabRecords = useMemo(() => {
    switch (tab) {
      case "upcoming":
        return allRecords
          .filter((r) => new Date(r.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "overdue":
        return allRecords
          .filter((r) => new Date(r.date) < today && r.urgent)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "recent": {
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() - 30);
        return allRecords
          .filter((r) => {
            const d = new Date(r.date);
            return d >= cutoff && d <= today;
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      case "all":
      default:
        return [...allRecords].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
  }, [allRecords, tab, today]);

  // Apply search and type filter
  const filteredRecords = useMemo(() => {
    let result = tabRecords;

    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.animal.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          formatDate(r.date).toLowerCase().includes(q)
      );
    }

    return result;
  }, [tabRecords, search, typeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; records: MedicalRecord[] }[] = [];
    const map = new Map<string, MedicalRecord[]>();
    for (const r of filteredRecords) {
      const existing = map.get(r.date);
      if (existing) {
        existing.push(r);
      } else {
        const arr = [r];
        map.set(r.date, arr);
        groups.push({ date: r.date, records: arr });
      }
    }
    return groups;
  }, [filteredRecords]);

  function handleAddRecord() {
    if (!formTitle.trim()) return;
    const newRecord: MedicalRecord = {
      id: `local-${Date.now()}`,
      animal: formAnimal,
      type: formType,
      title: formTitle.trim(),
      date: formDate,
      description: formDesc.trim(),
      urgent: formUrgent,
    };
    setLocalRecords((prev) => [...prev, newRecord]);
    setFormTitle("");
    setFormDesc("");
    setFormUrgent(false);
    setShowAddForm(false);
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: stats.dueThisWeek },
    { id: "overdue", label: "Overdue", count: stats.overdue },
    { id: "recent", label: "Recent", count: stats.completedThisMonth },
    { id: "all", label: "All Entries", count: stats.total },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Medical Entries</h1>
          <p className="text-sm text-warm-gray mt-1">
            Sanctuary-wide health tracking and care management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/medical/deworming-schedule"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-card-border text-charcoal rounded-lg text-sm font-medium hover:bg-cream transition-colors"
          >
            Deworming Schedule
          </Link>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "Add Entry"}
          </button>
        </div>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-card-border p-5 space-y-4">
          <h3 className="font-bold text-charcoal">New Medical Entry</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Type
              </label>
              <div className="relative">
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MedicalRecordType)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                >
                  {recordTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formUrgent}
                  onChange={(e) => setFormUrgent(e.target.checked)}
                  className="w-4 h-4 rounded border-card-border text-red-500 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-charcoal">
                  Mark as urgent
                </span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Hoof trim — routine"
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Description
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              placeholder="Details about the procedure, findings, or treatment..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddRecord}
              disabled={!formTitle.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-warm-gray font-medium">Overdue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.dueThisWeek}</p>
              <p className="text-xs text-warm-gray font-medium">Due This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.completedThisMonth}
              </p>
              <p className="text-xs text-warm-gray font-medium">This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
              <p className="text-xs text-warm-gray font-medium">Total Entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries... (e.g., 'Shelley blood work', 'hoof trim March', 'who got dewormed')"
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

      {/* Tabs + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="border-b border-card-border overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-sidebar text-sidebar"
                    : "border-transparent text-warm-gray hover:text-charcoal"
                }`}
              >
                {t.label}
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab === t.id
                      ? "bg-sidebar/10 text-sidebar"
                      : "bg-cream text-warm-gray"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative shrink-0">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as MedicalRecordType | "all")
            }
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
          >
            <option value="all">All Types</option>
            {recordTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-warm-gray absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Records list grouped by date */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-12 text-center">
          <Stethoscope className="w-10 h-10 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">No entries found</p>
          <p className="text-sm text-warm-gray/60 mt-1">
            {search
              ? "Try adjusting your search or filters"
              : "No entries match this view"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.date}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-3">
                {formatDateGroup(group.date)}
              </h4>
              <div className="space-y-3">
                {group.records.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
