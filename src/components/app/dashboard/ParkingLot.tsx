"use client";

import {
  Inbox,
  Check,
  Trash2,
  ClipboardCheck,
  Stethoscope,
  UtensilsCrossed,
  AlertTriangle,
  StickyNote,
  Sparkles,
} from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";

const typeConfig: Record<
  EntryType,
  { label: string; icon: typeof StickyNote; color: string; bg: string; border: string }
> = {
  note: { label: "Note", icon: StickyNote, color: "text-warm-gray", bg: "bg-gray-50", border: "border-gray-200" },
  task: { label: "Task", icon: ClipboardCheck, color: "text-sky-700", bg: "bg-sky/5", border: "border-sky/20" },
  medical: { label: "Medical", icon: Stethoscope, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  feed: { label: "Feed", icon: UtensilsCrossed, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  watch: { label: "Watch", icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  update: { label: "Update", icon: Sparkles, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ParkingLot() {
  const { entries, resolveEntry, removeEntry } = useParkingLot();

  const unresolved = entries.filter((e) => !e.resolved);
  const resolved = entries.filter((e) => e.resolved);

  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-sidebar" />
          <h3 className="font-bold text-charcoal text-lg">Notes</h3>
          {unresolved.length > 0 && (
            <span className="bg-sidebar text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {unresolved.length}
            </span>
          )}
        </div>
        <p className="text-xs text-warm-gray">
          {unresolved.length} pending · {resolved.length} done
        </p>
      </div>

      {/* Unresolved entries */}
      {unresolved.length > 0 && (
        <div className="space-y-2 mb-4">
          {unresolved.map((entry) => {
            const config = typeConfig[entry.type];
            const Icon = config.icon;
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-warm-gray/60">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal">{entry.text}</p>
                  {/* Show structured data if present */}
                  {entry.data && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {entry.data.animal && (
                        <span className="text-[10px] font-medium text-sky-dark bg-sky/10 px-1.5 py-0.5 rounded">
                          {entry.data.animal}
                        </span>
                      )}
                      {entry.data.timeBlock && (
                        <span className="text-[10px] font-medium text-warm-gray bg-cream px-1.5 py-0.5 rounded">
                          {entry.data.timeBlock}
                        </span>
                      )}
                      {entry.data.assignee && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          → {entry.data.assignee}
                        </span>
                      )}
                      {entry.data.severity && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
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
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => resolveEntry(entry.id)}
                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Mark as handled"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 text-warm-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Discard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved entries (collapsed) */}
      {resolved.length > 0 && (
        <div className="border-t border-card-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/50 mb-2">
            Recently handled ({resolved.length})
          </p>
          <div className="space-y-1">
            {resolved.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded text-sm"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-warm-gray line-through truncate flex-1">
                  {entry.text}
                </span>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 text-warm-gray/40 hover:text-red-500 transition-colors shrink-0"
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
