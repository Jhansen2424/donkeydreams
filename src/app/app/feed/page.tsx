"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, AlertCircle, Plus, X, Check, Trash2, Pencil } from "lucide-react";
import type { FeedSchedule } from "@/lib/sanctuary-data";
import { animals } from "@/lib/animals";
import { useParkingLot } from "@/lib/parking-lot-context";

const noteStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  daily: { bg: "bg-sky/5", border: "border-sky/20", text: "text-charcoal", icon: "text-sky" },
  ongoing: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-500" },
  evergreen: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-500" },
};

const categoryLabels: Record<string, string> = {
  daily: "Daily",
  ongoing: "Ongoing",
  evergreen: "Permanent",
};

type FeedNoteCategory = "daily" | "ongoing" | "evergreen";

interface ApiFeedEntry {
  id: string;
  animal: string;
  notes: string;
  plan: {
    am: { item: string; amount: string }[];
    mid: { item: string; amount: string }[];
    pm: { item: string; amount: string }[];
  };
}

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [schedules, setSchedules] = useState<ApiFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiFeedEntry | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const { entries: parkingEntries, addEntry, removeEntry } = useParkingLot();

  // Load feed plans from the API.
  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load feed plans");
      const body = (await res.json()) as { entries: ApiFeedEntry[] };
      setSchedules(body.entries);
    } catch {
      // surfaced below; leave list empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  // Feed notes live as parking-lot entries of type "feed". The category is
  // stored on `data.category` (daily/ongoing/evergreen).
  const feedNotes = parkingEntries
    .filter((e) => e.type === "feed" && !e.resolved)
    .map((e) => ({
      id: e.id,
      text: e.text,
      category: (e.data?.category ?? "daily") as FeedNoteCategory,
    }));

  const filtered = schedules.filter((f) =>
    f.animal.toLowerCase().includes(search.toLowerCase())
  );

  const animalsWithoutPlan = useMemo(() => {
    const have = new Set(schedules.map((s) => s.animal));
    return animals
      .filter((a) => !have.has(a.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Daily Feed Buckets
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {schedules.length} donkeys with custom feed plans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
            <input
              type="text"
              placeholder="Search donkey..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 w-full sm:w-56"
            />
          </div>
          <button
            onClick={() => setAddingNew(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add feed plan
          </button>
        </div>
      </div>

      {/* Feed notes */}
      <FeedNotesSection
        notes={feedNotes}
        onAdd={async (text, category) => {
          await addEntry("feed", text, { category });
        }}
        onRemove={(id) => removeEntry(id)}
      />

      {/* Feed grid */}
      {loading ? (
        <p className="text-sm text-warm-gray/60 text-center py-10">Loading feed plans...</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((schedule) => (
            <FeedCard
              key={schedule.animal}
              schedule={schedule}
              onEdit={() => setEditing(schedule)}
              onDelete={async () => {
                if (confirm(`Delete feed plan for ${schedule.animal}?`)) {
                  await fetch(`/api/feed?id=${schedule.id}`, { method: "DELETE" });
                  await reload();
                }
              }}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🫏</p>
          <p className="text-warm-gray font-medium">No feed plans found</p>
          <button
            onClick={() => setAddingNew(true)}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add feed plan
          </button>
        </div>
      )}

      {(editing || addingNew) && (
        <FeedPlanModal
          initial={editing}
          animalChoices={
            editing
              ? [editing.animal]
              : animalsWithoutPlan.map((a) => a.name)
          }
          onClose={() => {
            setEditing(null);
            setAddingNew(false);
          }}
          onSave={async (data) => {
            await fetch("/api/feed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            await reload();
            setEditing(null);
            setAddingNew(false);
          }}
        />
      )}
    </div>
  );
}

function FeedCard({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: ApiFeedEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meals = [
    { label: "AM", items: schedule.plan.am, color: "bg-amber-500" },
    { label: "MID", items: schedule.plan.mid, color: "bg-sky" },
    { label: "PM", items: schedule.plan.pm, color: "bg-purple-500" },
  ];

  return (
    <div className="group bg-white rounded-xl border border-card-border overflow-hidden">
      <div className="bg-sidebar px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-white">{schedule.animal}</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {meals.map((m) => (
              <span
                key={m.label}
                className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${m.color}`}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              title="Edit plan"
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete plan"
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60">
              <th className="text-left pb-2">Item</th>
              <th className="text-center pb-2 w-16">AM</th>
              <th className="text-center pb-2 w-16">MID</th>
              <th className="text-center pb-2 w-16">PM</th>
            </tr>
          </thead>
          <tbody>
            {getItemRows(schedule).map((row) => (
              <tr key={row.item} className="border-t border-card-border">
                <td className="py-2 font-medium text-charcoal">{row.item}</td>
                <td className="py-2 text-center text-warm-gray">{row.am || "—"}</td>
                <td className="py-2 text-center text-warm-gray">{row.mid || "—"}</td>
                <td className="py-2 text-center text-warm-gray">{row.pm || "—"}</td>
              </tr>
            ))}
            {getItemRows(schedule).length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-xs text-warm-gray/60">
                  No items yet — click edit to add.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {schedule.notes && (
          <div className="mt-3 p-2.5 bg-cream/50 rounded-lg">
            <p className="text-xs text-warm-gray leading-relaxed">{schedule.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getItemRows(schedule: Pick<FeedSchedule, "plan"> | ApiFeedEntry) {
  const items = new Map<string, { item: string; am: string; mid: string; pm: string }>();
  for (const entry of schedule.plan.am) {
    if (!items.has(entry.item)) items.set(entry.item, { item: entry.item, am: "", mid: "", pm: "" });
    items.get(entry.item)!.am = entry.amount;
  }
  for (const entry of schedule.plan.mid) {
    if (!items.has(entry.item)) items.set(entry.item, { item: entry.item, am: "", mid: "", pm: "" });
    items.get(entry.item)!.mid = entry.amount;
  }
  for (const entry of schedule.plan.pm) {
    if (!items.has(entry.item)) items.set(entry.item, { item: entry.item, am: "", mid: "", pm: "" });
    items.get(entry.item)!.pm = entry.amount;
  }
  return Array.from(items.values());
}

// ── Feed Plan Edit Modal ──

function FeedPlanModal({
  initial,
  animalChoices,
  onClose,
  onSave,
}: {
  initial: ApiFeedEntry | null;
  animalChoices: string[];
  onClose: () => void;
  onSave: (data: {
    animal: string;
    plan: ApiFeedEntry["plan"];
    notes: string;
  }) => Promise<void>;
}) {
  const [animal, setAnimal] = useState(initial?.animal ?? animalChoices[0] ?? "");
  const [am, setAm] = useState(initial?.plan.am ?? []);
  const [mid, setMid] = useState(initial?.plan.mid ?? []);
  const [pm, setPm] = useState(initial?.plan.pm ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!animal) return;
    setSaving(true);
    try {
      await onSave({
        animal,
        plan: {
          am: am.filter((x) => x.item.trim().length > 0),
          mid: mid.filter((x) => x.item.trim().length > 0),
          pm: pm.filter((x) => x.item.trim().length > 0),
        },
        notes,
      });
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
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">{initial ? "Edit feed plan" : "New feed plan"}</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Animal
            </label>
            <select
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              disabled={!!initial}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50 disabled:opacity-60"
            >
              {animalChoices.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <MealEditor label="AM (Breakfast)" items={am} onChange={setAm} />
          <MealEditor label="Mid (Lunch)" items={mid} onChange={setMid} />
          <MealEditor label="PM (Dinner)" items={pm} onChange={setPm} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Special handling, e.g. soak for 10 min..."
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
            disabled={!animal || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : "Save plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MealEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: { item: string; amount: string }[];
  onChange: (next: { item: string; amount: string }[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
        {label}
      </label>
      <div className="space-y-2">
        {items.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={row.item}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], item: e.target.value };
                onChange(next);
              }}
              placeholder="Hay, teff, senior feed..."
              className="flex-1 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
            <input
              value={row.amount}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], amount: e.target.value };
                onChange(next);
              }}
              placeholder="1 flake"
              className="w-32 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-2 text-warm-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, { item: "", amount: "" }])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sidebar hover:text-sidebar-light"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>
    </div>
  );
}

// ── Feed Notes Section ──
// Notes persist as parking-lot entries (type "feed") with category on data.

function FeedNotesSection({
  notes,
  onAdd,
  onRemove,
}: {
  notes: { id: string; text: string; category: FeedNoteCategory }[];
  onAdd: (text: string, category: FeedNoteCategory) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<FeedNoteCategory>("daily");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await onAdd(text, category);
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60">Legend:</span>
        {Object.entries(noteStyles).map(([key, style]) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-warm-gray">
            <span className={`w-2.5 h-2.5 rounded-full ${style.bg} border ${style.border}`} />
            {categoryLabels[key]}
          </span>
        ))}
      </div>

      {notes.map((note) => {
        const style = noteStyles[note.category] || noteStyles.daily;
        return (
          <div
            key={note.id}
            className={`group flex items-start gap-2 p-3 rounded-lg border ${style.bg} ${style.border}`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${style.icon}`} />
            <div className="flex-1">
              <p className={`text-sm ${style.text}`}>{note.text}</p>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.icon} mt-1 inline-block`}>
                {categoryLabels[note.category]}
              </span>
            </div>
            <button
              onClick={() => onRemove(note.id)}
              title="Remove note"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-warm-gray/60 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add note */}
      <div className="flex items-center gap-2 p-2 bg-white border border-card-border rounded-lg">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Add a feed note..."
          className="flex-1 px-3 py-1.5 text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FeedNoteCategory)}
          className="px-2 py-1.5 text-xs border border-card-border rounded-md bg-white text-charcoal"
        >
          <option value="daily">Daily</option>
          <option value="ongoing">Ongoing</option>
          <option value="evergreen">Permanent</option>
        </select>
        <button
          onClick={() => void handleAdd()}
          disabled={!draft.trim() || saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sidebar text-white rounded-md text-xs font-semibold hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
