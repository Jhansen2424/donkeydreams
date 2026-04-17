"use client";

import { useState } from "react";
import {
  Inbox,
  Check,
  Trash2,
  ClipboardCheck,
  Stethoscope,
  UtensilsCrossed,
  AlertTriangle,
  StickyNote,
  ArrowRight,
  Sparkles,
  Loader2,
  Tag,
} from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";
import { useSchedule } from "@/lib/schedule-context";

const typeConfig: Record<
  EntryType,
  { label: string; icon: typeof StickyNote; color: string; bg: string; border: string }
> = {
  note:    { label: "Note",    icon: StickyNote,      color: "text-warm-gray",  bg: "bg-gray-50",    border: "border-gray-200" },
  task:    { label: "Task",    icon: ClipboardCheck,  color: "text-sky-700",    bg: "bg-sky/5",      border: "border-sky/20" },
  medical: { label: "Medical", icon: Stethoscope,     color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200" },
  feed:    { label: "Feed",    icon: UtensilsCrossed, color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  watch:   { label: "Watch",   icon: AlertTriangle,   color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200" },
  update:  { label: "Update",  icon: Sparkles,        color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function currentTimeBlock(): "AM" | "Mid" | "PM" {
  const h = new Date().getHours();
  if (h < 10) return "AM";
  if (h < 16) return "Mid";
  return "PM";
}

type FilterKey = "all" | EntryType;

export default function NotesPage() {
  const { entries, resolveEntry, removeEntry, updateEntry, loading, error } = useParkingLot();
  const { addTask } = useSchedule();
  const [filter, setFilter] = useState<FilterKey>("all");
  // Track which entry's category picker is open so we can show a dropdown
  // on demand without cluttering the default layout.
  const [catPickerId, setCatPickerId] = useState<string | null>(null);

  const unresolved = entries.filter((e) => !e.resolved);
  const resolved = entries.filter((e) => e.resolved);

  const filteredUnresolved =
    filter === "all" ? unresolved : unresolved.filter((e) => e.type === filter);

  // Promote a note → schedule task. Resolves the note once the task is created.
  const promoteToTask = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    addTask({
      task: entry.text,
      blockName: entry.data?.timeBlock ?? currentTimeBlock(),
      assignedTo: entry.data?.assignee,
      animalSpecific: entry.data?.animal,
    });
    resolveEntry(id);
  };

  const counts: Record<FilterKey, number> = {
    all: unresolved.length,
    note: unresolved.filter((e) => e.type === "note").length,
    task: unresolved.filter((e) => e.type === "task").length,
    medical: unresolved.filter((e) => e.type === "medical").length,
    feed: unresolved.filter((e) => e.type === "feed").length,
    watch: unresolved.filter((e) => e.type === "watch").length,
    update: unresolved.filter((e) => e.type === "update").length,
  };

  const filterTabs: { key: FilterKey; label: string; icon?: typeof StickyNote }[] = [
    { key: "all",     label: "All",     icon: Inbox },
    { key: "note",    label: "Notes",   icon: StickyNote },
    { key: "task",    label: "Tasks",   icon: ClipboardCheck },
    { key: "watch",   label: "Watch",   icon: AlertTriangle },
    { key: "medical", label: "Medical", icon: Stethoscope },
    { key: "feed",    label: "Feed",    icon: UtensilsCrossed },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Inbox className="w-6 h-6 text-sidebar" />
          <h1 className="text-2xl font-bold text-charcoal">Notes</h1>
          {unresolved.length > 0 && (
            <span className="bg-sidebar text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unresolved.length}
            </span>
          )}
        </div>
        <p className="text-sm text-warm-gray">
          Quick captures from Joshy and the field. Promote a note to a task, or dismiss it.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-card-border pb-3">
        {filterTabs.map((tab) => {
          const active = filter === tab.key;
          const count = counts[tab.key];
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                active
                  ? "bg-sidebar text-white border-sidebar"
                  : "bg-white text-warm-gray border-card-border hover:bg-cream hover:text-charcoal"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-sidebar/10 text-sidebar"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state (only on first load) */}
      {loading && entries.length === 0 && (
        <div className="bg-white rounded-xl border border-card-border p-10 text-center">
          <Loader2 className="w-8 h-8 text-warm-gray/40 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-warm-gray">Loading notes...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredUnresolved.length === 0 && (
        <div className="bg-white rounded-xl border border-card-border p-10 text-center">
          <Sparkles className="w-10 h-10 text-warm-gray/40 mx-auto mb-3" />
          <p className="text-charcoal font-semibold mb-1">
            {unresolved.length === 0 ? "No notes right now" : "No notes in this filter"}
          </p>
          <p className="text-sm text-warm-gray">
            {unresolved.length === 0
              ? "Say \"Hey Joshy\" or tap the + button to capture one."
              : "Try a different filter."}
          </p>
        </div>
      )}

      {/* Unresolved list */}
      {filteredUnresolved.length > 0 && (
        <div className="space-y-2">
          {filteredUnresolved.map((entry) => {
            const cfg = typeConfig[entry.type];
            const Icon = cfg.icon;
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-warm-gray/60">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal leading-snug">{entry.text}</p>

                  {entry.data && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.data.animal && (
                        <span className="text-[11px] font-medium text-sky-dark bg-sky/10 px-2 py-0.5 rounded-lg">
                          {entry.data.animal}
                        </span>
                      )}
                      {entry.data.timeBlock && (
                        <span className="text-[11px] font-medium text-warm-gray bg-cream px-2 py-0.5 rounded-lg">
                          {entry.data.timeBlock}
                        </span>
                      )}
                      {entry.data.assignee && (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                          → {entry.data.assignee}
                        </span>
                      )}
                      {entry.data.severity && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                          entry.data.severity === "high"
                            ? "text-red-700 bg-red-100"
                            : entry.data.severity === "medium"
                              ? "text-amber-700 bg-amber-100"
                              : "text-emerald-700 bg-emerald-100"
                        }`}>
                          {entry.data.severity}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions — promote to a task, re-category, or dismiss. */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      onClick={() => promoteToTask(entry.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky hover:bg-sky-dark rounded-lg transition-colors"
                      title="Add this to today's schedule"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Make a task
                    </button>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setCatPickerId((cur) => (cur === entry.id ? null : entry.id))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-charcoal bg-white border border-card-border hover:bg-cream rounded-lg transition-colors"
                        title="Change category"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Category: {typeConfig[entry.type].label}
                      </button>
                      {catPickerId === entry.id && (
                        <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg border border-card-border shadow-lg p-1 min-w-[160px]">
                          {(Object.keys(typeConfig) as EntryType[]).map((t) => {
                            const TIcon = typeConfig[t].icon;
                            return (
                              <button
                                key={t}
                                onClick={async () => {
                                  setCatPickerId(null);
                                  if (t !== entry.type) {
                                    await updateEntry(entry.id, { type: t });
                                  }
                                }}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                                  entry.type === t
                                    ? "bg-cream text-charcoal"
                                    : "text-charcoal hover:bg-cream/60"
                                }`}
                              >
                                <TIcon className={`w-3.5 h-3.5 ${typeConfig[t].color}`} />
                                <span>{typeConfig[t].label}</span>
                                {entry.type === t && (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warm-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                      title="Dismiss this note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved / handled */}
      {resolved.length > 0 && (
        <div className="bg-white rounded-xl border border-card-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charcoal">
              Recently handled
              <span className="text-warm-gray font-normal ml-2">({resolved.length})</span>
            </h3>
          </div>
          <div className="space-y-1">
            {resolved.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-warm-gray line-through truncate flex-1">{entry.text}</span>
                <span className="text-[10px] text-warm-gray/50 shrink-0">{formatTime(entry.timestamp)}</span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 text-warm-gray/40 hover:text-red-500 transition-colors shrink-0"
                  title="Delete permanently"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
