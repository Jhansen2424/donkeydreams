"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  Clock,
} from "lucide-react";
import { watchList, type WatchListEntry } from "@/lib/sanctuary-data";

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

export default function WatchListPage() {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(
    "all"
  );

  const filtered =
    filter === "all" ? watchList : watchList.filter((e) => e.severity === filter);

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
            {watchList.length} active alerts
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors self-start">
          <Plus className="w-4 h-4" />
          Add Alert
        </button>
      </div>

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
              ? `All (${watchList.length})`
              : `${level.charAt(0).toUpperCase() + level.slice(1)} (${watchList.filter((e) => e.severity === level).length})`}
          </button>
        ))}
      </div>

      {/* Watch entries */}
      <div className="space-y-4">
        {filtered.map((entry, i) => (
          <WatchCard key={i} entry={entry} />
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

function WatchCard({ entry }: { entry: WatchListEntry }) {
  const styles = severityStyles[entry.severity];

  return (
    <div
      className={`rounded-xl border p-5 ${styles.bg}`}
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
