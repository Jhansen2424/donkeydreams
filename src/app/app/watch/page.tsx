"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  Clock,
  X,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { watchList, type WatchListEntry } from "@/lib/sanctuary-data";
import { useParkingLot } from "@/lib/parking-lot-context";
import { animals } from "@/lib/animals";
import { volunteers } from "@/lib/volunteer-data";

const severityStyles = {
  high: { dot: "bg-red-500", bg: "bg-red-50 border-red-200", label: "High" },
  medium: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-200",
    label: "Medium",
  },
  low: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Low",
  },
};

// Merged list rows carry an optional parking-lot id so editable rows know
// which DB entry to update. Seed rows have `editableId: undefined`.
type MergedWatch = WatchListEntry & { editableId?: string };

export default function WatchListPage() {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(
    "all"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; entry: MergedWatch } | null>(null);
  const { entries, addEntry, updateEntry, removeEntry } = useParkingLot();

  // Pull any parking-lot watch entries into the merged view so newly-added
  // alerts render immediately, alongside whatever seed watchList is loaded.
  const parkingWatch: MergedWatch[] = entries
    .filter((e) => e.type === "watch" && !e.resolved)
    .map((e) => ({
      editableId: e.id,
      date: e.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      animal: e.data?.animal || "—",
      issue: e.text,
      treatment: e.data?.title || "",
      assignedTo: e.data?.assignee || "",
      severity: (e.data?.severity as "high" | "medium" | "low") || "medium",
    }));

  const merged: MergedWatch[] = [...parkingWatch, ...watchList];

  const filtered =
    filter === "all" ? merged : merged.filter((e) => e.severity === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Donkeys to Watch
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {merged.length} active alerts
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          Add Alert
        </button>
      </div>

      {addOpen && (
        <AddAlertModal
          onClose={() => setAddOpen(false)}
          onSubmit={async ({ animal, issue, treatment, assignedTo, severity }) => {
            await addEntry("watch", issue, {
              animal,
              title: treatment || undefined,
              assignee: assignedTo || undefined,
              severity,
            });
            setAddOpen(false);
          }}
        />
      )}

      {/* Severity filters */}
      <div className="flex gap-2">
        {(["all", "high", "medium", "low"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === level
                ? "bg-sidebar text-white"
                : "bg-white border border-card-border text-charcoal hover:bg-cream"
            }`}
          >
            {level === "all"
              ? `All (${merged.length})`
              : `${level.charAt(0).toUpperCase() + level.slice(1)} (${merged.filter((e) => e.severity === level).length})`}
          </button>
        ))}
      </div>

      {editing && (
        <AddAlertModal
          initial={editing.entry}
          onClose={() => setEditing(null)}
          onSubmit={async ({ animal, issue, treatment, assignedTo, severity }) => {
            await updateEntry(editing.id, {
              type: "watch",
              text: issue,
              data: {
                animal,
                title: treatment || undefined,
                assignee: assignedTo || undefined,
                severity,
              },
            });
            setEditing(null);
          }}
        />
      )}

      {/* Watch entries */}
      <div className="space-y-4">
        {filtered.map((entry, i) => (
          <WatchCard
            key={entry.editableId ?? i}
            entry={entry}
            canEdit={Boolean(entry.editableId)}
            onEdit={() =>
              entry.editableId && setEditing({ id: entry.editableId, entry })
            }
            onDelete={async () => {
              if (!entry.editableId) return;
              if (confirm(`Dismiss watch alert for ${entry.animal}?`)) {
                await removeEntry(entry.editableId);
              }
            }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-card-border">
          <AlertTriangle className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">No alerts at this level</p>
        </div>
      )}
    </div>
  );
}

function AddAlertModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: WatchListEntry;
  onClose: () => void;
  onSubmit: (input: {
    animal: string;
    issue: string;
    treatment: string;
    assignedTo: string;
    severity: "high" | "medium" | "low";
  }) => Promise<void> | void;
}) {
  const [animal, setAnimal] = useState(initial?.animal ?? "");
  const [issue, setIssue] = useState(initial?.issue ?? "");
  const [treatment, setTreatment] = useState(initial?.treatment ?? "");
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? "");
  const [severity, setSeverity] = useState<"high" | "medium" | "low">(
    initial?.severity ?? "medium"
  );
  const [saving, setSaving] = useState(false);

  const canSave = animal.trim().length > 0 && issue.trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">{initial ? "Edit watch alert" : "New watch alert"}</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Animal
            </label>
            <input
              list="watch-animal-list"
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              placeholder="Start typing..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              autoFocus
            />
            <datalist id="watch-animal-list">
              {[...animals]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((a) => (
                  <option key={a.slug} value={a.name} />
                ))}
            </datalist>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Issue
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={2}
              placeholder="e.g. Limping on left front, needs monitoring"
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Treatment / plan
            </label>
            <input
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Bute 1g BID, recheck in 3 days"
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                Assigned to
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                <option value="">Unassigned</option>
                {volunteers
                  .filter((v) => v.status === "active")
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as "high" | "medium" | "low")}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
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
            disabled={!canSave || saving}
            onClick={async () => {
              if (!canSave) return;
              setSaving(true);
              try {
                await onSubmit({
                  animal: animal.trim(),
                  issue: issue.trim(),
                  treatment: treatment.trim(),
                  assignedTo: assignedTo.trim(),
                  severity,
                });
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            Save alert
          </button>
        </div>
      </div>
    </div>
  );
}

function WatchCard({
  entry,
  canEdit,
  onEdit,
  onDelete,
}: {
  entry: WatchListEntry;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const styles = severityStyles[entry.severity];

  return (
    <div
      className={`rounded-xl border p-5 ${styles.bg} group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
          <h3 className="text-lg font-bold text-charcoal">{entry.animal}</h3>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/70">
            {styles.label} Priority
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-warm-gray/60">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{entry.date}</span>
          {canEdit && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <button
                onClick={onEdit}
                title="Edit alert"
                className="p-1 rounded-md text-warm-gray hover:text-sidebar hover:bg-white/50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                title="Delete alert"
                className="p-1 rounded-md text-warm-gray hover:text-red-600 hover:bg-white/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ml-6 space-y-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/50 mb-0.5">
            Issue
          </p>
          <p className="text-sm text-charcoal">{entry.issue}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/50 mb-0.5">
            Treatment
          </p>
          <p className="text-sm text-charcoal">{entry.treatment}</p>
        </div>
        {entry.assignedTo && (
          <p className="text-sm text-sky-dark font-medium">
            Assigned to: {entry.assignedTo}
          </p>
        )}
      </div>
    </div>
  );
}
