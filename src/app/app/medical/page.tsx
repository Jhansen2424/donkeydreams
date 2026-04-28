"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import {
  allMedicalEntries as baseRecords,
  recordTypes,
  typeBadgeColors,
  type MedicalRecord,
  type MedicalRecordType,
} from "@/lib/medical-data";
import { useMedical } from "@/lib/medical-context";
import { animals } from "@/lib/animals";
import { yardWideDewormings } from "@/lib/deworming-vaccination-data";
import ProviderPanel, { type ProviderType } from "@/components/app/ProviderPanel";
import { useProviders } from "@/lib/providers-context";
import { volunteers } from "@/lib/volunteer-data";
import { formatDate as sharedFormatDate } from "@/lib/format-date";
import { Phone } from "lucide-react";

type Tab = "upcoming" | "overdue" | "recent" | "all";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Both formatters now route through the centralized MM-DD-YYYY helper.
// formatDateGroup keeps the weekday prefix (used for the day-bucket headers
// in the medical entry list) but the date itself is MM-DD-YYYY.
function formatDate(iso: string) {
  return sharedFormatDate(iso);
}

function formatDateGroup(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return sharedFormatDate(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday}, ${sharedFormatDate(iso)}`;
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

function RecordCard({
  record,
  onEdit,
  onDelete,
  canEdit,
}: {
  record: MedicalRecord;
  onEdit: (record: MedicalRecord) => void;
  onDelete: (record: MedicalRecord) => void;
  canEdit: boolean;
}) {
  return (
    <div
      className={`group bg-white rounded-xl border p-4 flex items-start gap-4 ${
        record.urgent ? "border-red-200 bg-red-50/30" : "border-card-border"
      }`}
    >
      {record.urgent && (
        <AlertCircle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Link
            href={`/app/animals/${slugify(record.animal)}?tab=medical`}
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
        <p className="text-xs text-warm-gray mt-0.5">
          {formatDate(record.date)}
          {record.provider && (
            <>
              <span className="mx-1.5">·</span>
              <span className="font-medium text-sky-dark">{record.provider}</span>
            </>
          )}
        </p>
        {record.description && (
          <p className="text-sm text-warm-gray mt-2 leading-relaxed whitespace-pre-line">
            {record.description}
          </p>
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(record)}
            title="Edit entry"
            className="p-1.5 rounded-md text-warm-gray hover:text-sidebar hover:bg-sidebar/10 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(record)}
            title="Delete entry"
            className="p-1.5 rounded-md text-warm-gray hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EditRecordModal({
  record,
  onClose,
  onSave,
}: {
  record: MedicalRecord;
  onClose: () => void;
  onSave: (updates: {
    animal: string;
    type: MedicalRecordType;
    title: string;
    date: string;
    description: string;
    urgent: boolean;
    provider: string;
  }) => Promise<void>;
}) {
  const [animal, setAnimal] = useState(record.animal);
  const [type, setType] = useState<MedicalRecordType>(record.type);
  const [title, setTitle] = useState(record.title);
  const [date, setDate] = useState(record.date);
  const [description, setDescription] = useState(record.description);
  const [urgent, setUrgent] = useState(record.urgent);
  const [provider, setProvider] = useState(record.provider ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ animal, type, title: title.trim(), date, description, urgent, provider });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">Edit medical entry</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Animal
              </label>
              <select
                value={animal}
                onChange={(e) => setAnimal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                {[...animals].sort((a, b) => a.name.localeCompare(b.name)).map((a) => (
                  <option key={a.slug} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MedicalRecordType)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                {recordTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-4 h-4 rounded border-card-border text-red-500 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-charcoal">Urgent</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Provider
            </label>
            <input
              list="medical-provider-list"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Vet, farrier, or dentist name..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-card-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MedicalDashboardPageWrapper() {
  // useSearchParams must be inside <Suspense> per the Next.js 15 contract.
  return (
    <Suspense>
      <MedicalDashboardPage />
    </Suspense>
  );
}

function MedicalDashboardPage() {
  // Real "today" at 00:00 local time — used for upcoming/overdue cutoffs.
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayIso = useMemo(() => today.toISOString().split("T")[0], [today]);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MedicalRecordType | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const { providers, add: addProviderToDb, remove: removeProviderFromDb } =
    useProviders();
  const [showProviderPanel, setShowProviderPanel] = useState(false);
  const { entries: dbEntries, addEntry: addMedicalEntry, updateEntry: updateMedicalEntry, removeEntry: removeMedicalEntry } = useMedical();
  const [editing, setEditing] = useState<MedicalRecord | null>(null);

  // Add form state
  const [formAnimal, setFormAnimal] = useState(animals[0]?.name || "");
  const [formType, setFormType] = useState<MedicalRecordType>("Vet Visit");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(todayIso);
  const [formDesc, setFormDesc] = useState("");
  const [formUrgent, setFormUrgent] = useState(false);
  const [formNextDate, setFormNextDate] = useState("");
  const [formProvider, setFormProvider] = useState("");

  // Honor `?animal=X&type=Y&open=1` from the animal-profile +Add Entry link
  // so the form opens prefilled instead of defaulting to the first donkey.
  const searchParams = useSearchParams();
  useEffect(() => {
    const animalParam = searchParams.get("animal");
    const typeParam = searchParams.get("type");
    const openParam = searchParams.get("open");
    if (animalParam && animals.find((a) => a.name === animalParam)) {
      setFormAnimal(animalParam);
    }
    if (typeParam && (recordTypes as readonly string[]).includes(typeParam)) {
      setFormType(typeParam as MedicalRecordType);
    }
    if (openParam) setShowAddForm(true);
    // Run once on mount — we don't want subsequent state changes (e.g. user
    // clearing the form) to re-trigger the prefill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Types that should prompt the user for a follow-up ("next treatment")
  // date alongside the main entry.
  const typesNeedingNextDate: MedicalRecordType[] = [
    "Deworming",
    "Hoof & Dental",
    "Vaccination",
  ];
  const needsNextDate = typesNeedingNextDate.includes(formType);

  // DB entries are the source of truth for newly-created records. Seed CSVs
  // (`baseRecords`) still supply historical imports. Dedupe on id so an
  // optimistic entry doesn't double when the server echo arrives.
  const allRecords = useMemo(() => {
    const seen = new Set<string>();
    const merged: MedicalRecord[] = [];
    for (const r of [...dbEntries, ...baseRecords]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push(r);
    }
    return merged;
  }, [dbEntries]);

  // Parse a record's ISO date string at local midnight so comparisons are
  // apples-to-apples with `today` (also local midnight).
  const toLocalDate = (iso: string) => new Date(iso + "T00:00:00");

  // Stats
  const stats = useMemo(() => {
    const overdueCount = allRecords.filter((r) => {
      return toLocalDate(r.date) < today && r.urgent;
    }).length;

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const dueThisWeek = allRecords.filter((r) => {
      const d = toLocalDate(r.date);
      return d >= today && d <= weekFromNow;
    }).length;

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const completedThisMonth = allRecords.filter((r) => {
      const d = toLocalDate(r.date);
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
      case "upcoming": {
        // Match the "Due This Week" stat card: only records in the next 7
        // days (inclusive). Previously this showed all future records, which
        // leaked "no-record-yet" items (scheduled far in the future) into
        // the list even though the stat card only counted the next week.
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return allRecords
          .filter((r) => {
            const d = toLocalDate(r.date);
            return d >= today && d <= weekFromNow;
          })
          .sort((a, b) => a.date.localeCompare(b.date));
      }
      case "overdue":
        return allRecords
          .filter((r) => toLocalDate(r.date) < today && r.urgent)
          .sort((a, b) => a.date.localeCompare(b.date));
      case "recent": {
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() - 30);
        return allRecords
          .filter((r) => {
            const d = toLocalDate(r.date);
            return d >= cutoff && d <= today;
          })
          .sort((a, b) => b.date.localeCompare(a.date));
      }
      case "all":
      default:
        return [...allRecords].sort((a, b) => b.date.localeCompare(a.date));
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

  async function handleAddRecord() {
    if (!formTitle.trim()) return;
    // For treatment types we require a next-date so follow-ups don't slip.
    if (needsNextDate && !formNextDate) return;

    const desc = formDesc.trim();
    const combinedDesc = formNextDate
      ? `${desc}${desc ? "\n\n" : ""}Next treatment due: ${formNextDate}`
      : desc;

    await addMedicalEntry({
      animal: formAnimal,
      type: formType,
      title: formTitle.trim(),
      date: formDate,
      description: combinedDesc,
      urgent: formUrgent,
      provider: formProvider,
    });

    // If the user supplied a next-treatment date, also persist a follow-up
    // entry on that date so the schedule reflects the next dose/visit.
    if (formNextDate) {
      await addMedicalEntry({
        animal: formAnimal,
        type: formType,
        title: `${formTitle.trim()} — follow-up`,
        date: formNextDate,
        description: `Scheduled follow-up for ${formType.toLowerCase()} on ${formDate}.`,
        urgent: false,
      });
    }

    setFormTitle("");
    setFormDesc("");
    setFormUrgent(false);
    setFormNextDate("");
    setFormProvider("");
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
            onClick={() => setShowProviderPanel((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-card-border text-charcoal rounded-lg text-sm font-medium hover:bg-cream transition-colors"
          >
            <Phone className="w-4 h-4" />
            Providers
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "Add Entry"}
          </button>
        </div>
      </div>

      {showProviderPanel && (
        <ProviderPanel
          providers={providers}
          onAdd={(p: { name: string; type: ProviderType; phone: string }) => {
            void addProviderToDb(p);
          }}
          onRemove={(name) => {
            const target = providers.find((p) => p.name === name);
            if (target) void removeProviderFromDb(target.id);
          }}
          onClose={() => setShowProviderPanel(false)}
        />
      )}

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
              Performed by
            </label>
            <input
              list="medical-provider-list"
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value)}
              placeholder="Staff name, vet, farrier, or dentist..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
            {/* Combined list of providers (vets/farriers/dentists from the */}
            {/* providers DB) and active staff (volunteers with status      */}
            {/* "active") so users can pick whoever actually performed the  */}
            {/* treatment. The dev team specifically asked for staff to be  */}
            {/* selectable here since most annual exams are done in-house.  */}
            <datalist id="medical-provider-list">
              {providers.map((p) => (
                <option key={`prov-${p.name}`} value={p.name}>
                  {p.type}
                </option>
              ))}
              {volunteers
                .filter((v) => v.status === "active")
                .map((v) => (
                  <option key={`staff-${v.name}`} value={v.name}>
                    Staff
                  </option>
                ))}
            </datalist>
          </div>
          {needsNextDate && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
                Next Treatment Date
                <span className="ml-1 text-[10px] font-medium text-amber-700">
                  (required for {formType})
                </span>
              </label>
              <input
                type="date"
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
                min={formDate}
                className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
              <p className="text-[11px] text-amber-700 mt-1">
                We&apos;ll add a follow-up entry on this date so the next dose
                / visit shows up in the upcoming list.
              </p>
            </div>
          )}
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
              disabled={!formTitle.trim() || (needsNextDate && !formNextDate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Yard-wide deworming events — sourced from PREV-HERD rows in the
          deworming/vaccination CSV. These represent sanctuary-wide protocol
          dates (every donkey received that drug on that date). */}
      {yardWideDewormings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-charcoal text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-orange-600" />
              Yard-Wide Deworming Schedule
            </h3>
            <span className="text-[11px] text-orange-700/80 font-medium">
              Whole sanctuary
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {yardWideDewormings.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-orange-200/60 rounded-lg px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700/70">
                  {formatDate(event.date)}
                </p>
                <p className="text-sm font-bold text-charcoal mt-0.5 capitalize">
                  {event.drug.toLowerCase()}
                </p>
                <p className="text-[11px] text-warm-gray mt-0.5 leading-snug">
                  {event.dose}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats row — each card filters the list below to the matching tab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setTab("overdue")}
          className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
            tab === "overdue" ? "border-red-400 ring-2 ring-red-200" : "border-card-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-warm-gray font-medium">Overdue</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
            tab === "upcoming" ? "border-amber-400 ring-2 ring-amber-200" : "border-card-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.dueThisWeek}</p>
              <p className="text-xs text-warm-gray font-medium">Due This Week</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTab("recent")}
          className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
            tab === "recent" ? "border-emerald-400 ring-2 ring-emerald-200" : "border-card-border"
          }`}
        >
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
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
            tab === "all" ? "border-slate-400 ring-2 ring-slate-200" : "border-card-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
              <p className="text-xs text-warm-gray font-medium">Total Entries</p>
            </div>
          </div>
        </button>
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
                {group.records.map((record) => {
                  // Records whose id starts with a DB-ish cuid prefix are
                  // server-backed and safe to edit/delete. Seed records from
                  // medical-data.ts (sequential numeric ids) are read-only.
                  const isDbRecord = dbEntries.some((e) => e.id === record.id);
                  return (
                    <RecordCard
                      key={record.id}
                      record={record}
                      canEdit={isDbRecord}
                      onEdit={(r) => setEditing(r)}
                      onDelete={async (r) => {
                        if (confirm(`Delete medical entry for ${r.animal}: "${r.title}"?`)) {
                          await removeMedicalEntry(r.id);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditRecordModal
          record={editing}
          onClose={() => setEditing(null)}
          onSave={async (updates) => {
            await updateMedicalEntry(editing.id, updates);
          }}
        />
      )}
    </div>
  );
}
