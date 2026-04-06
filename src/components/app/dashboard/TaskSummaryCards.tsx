"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  categoryMeta,
  type ScheduleBlock,
  type TaskCategory,
} from "@/lib/sanctuary-data";

// Map user-facing dashboard filter groups to task categories
type DashboardFilter = "all" | "care" | "ranch" | "admin";

const filterLabels: Record<DashboardFilter, string> = {
  all: "All",
  care: "Donkey Care",
  ranch: "Yard / Ranch",
  admin: "Admin",
};

const filterCategories: Record<DashboardFilter, TaskCategory[] | null> = {
  all: null,
  care: ["feeding", "treatment", "special-needs", "hoof-dental", "weight"],
  ranch: ["routine"],
  admin: ["sponsor"],
};

interface CategorySummary {
  category: TaskCategory;
  label: string;
  color: string;
  bg: string;
  total: number;
  done: number;
}

export default function TaskSummaryCards({
  schedule,
  onNavigateToTasks,
}: {
  schedule: ScheduleBlock[];
  onNavigateToTasks?: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [expanded, setExpanded] = useState(true);

  // Aggregate tasks by category
  const allTasks = schedule.flatMap((b) => b.tasks);
  const categoryMap = new Map<TaskCategory, { total: number; done: number }>();

  for (const task of allTasks) {
    const existing = categoryMap.get(task.category) || { total: 0, done: 0 };
    existing.total++;
    if (task.done) existing.done++;
    categoryMap.set(task.category, existing);
  }

  const summaries: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([cat, counts]) => ({
      category: cat,
      label: categoryMeta[cat].label,
      color: categoryMeta[cat].color,
      bg: categoryMeta[cat].bg,
      ...counts,
    }))
    .filter((s) => {
      if (activeFilter === "all") return true;
      const allowed = filterCategories[activeFilter];
      return allowed ? allowed.includes(s.category) : true;
    })
    .sort((a, b) => {
      // Show incomplete first
      const aRatio = a.total > 0 ? a.done / a.total : 1;
      const bRatio = b.total > 0 ? b.done / b.total : 1;
      return aRatio - bRatio;
    });

  const filteredTotal = summaries.reduce((s, c) => s + c.total, 0);
  const filteredDone = summaries.reduce((s, c) => s + c.done, 0);
  const pct = filteredTotal > 0 ? Math.round((filteredDone / filteredTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          <h3 className="font-bold text-charcoal text-lg">Tasks Overview</h3>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-warm-gray" />
          ) : (
            <ChevronDown className="w-4 h-4 text-warm-gray" />
          )}
        </button>
        <span className="text-sm font-bold text-charcoal">
          {filteredDone}/{filteredTotal}{" "}
          <span className="text-warm-gray font-normal">({pct}%)</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-cream rounded-full h-2.5 mb-4">
        <div
          className="bg-gradient-to-r from-sky to-sky-dark h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(filterLabels) as DashboardFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeFilter === f
                ? "bg-sidebar text-white border-sidebar"
                : "bg-white text-charcoal border-card-border hover:bg-cream"
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Category breakdown */}
      {expanded && (
        <div className="space-y-2">
          {summaries.map((s) => {
            const ratio = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            const isComplete = s.done === s.total;
            return (
              <div
                key={s.category}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isComplete
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-cream/30 border-card-border"
                }`}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className={`w-4 h-4 rounded-full ${s.bg} shrink-0`} />
                )}
                <span
                  className={`text-sm font-medium flex-1 ${
                    isComplete ? "text-warm-gray line-through" : "text-charcoal"
                  }`}
                >
                  {s.label}
                </span>
                <span className="text-xs text-warm-gray font-medium">
                  {s.done}/{s.total}
                </span>
                <div className="w-16 bg-cream rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isComplete ? "bg-emerald-500" : "bg-sky"
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link to full tasks page */}
      {onNavigateToTasks && (
        <button
          onClick={onNavigateToTasks}
          className="mt-4 text-sm font-medium text-sky hover:text-sky-dark transition-colors"
        >
          View full task schedule →
        </button>
      )}
    </div>
  );
}
