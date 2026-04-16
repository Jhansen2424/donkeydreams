"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ListChecks, Briefcase, Tractor, Heart, Check, Plus } from "lucide-react";
import type { ScheduleBlock, ScheduleTask, TaskCategory } from "@/lib/sanctuary-data";

type Bucket = "admin" | "ranch" | "care";

// Map the existing category taxonomy onto the dashboard's Admin/Ranch/Care
// buckets. Sponsor work = admin; routine + feeding = ranch operations;
// everything animal-care related goes under care.
function bucketForCategory(category: TaskCategory): Bucket {
  switch (category) {
    case "sponsor":
      return "admin";
    case "routine":
    case "feeding":
      return "ranch";
    case "treatment":
    case "special-needs":
    case "hoof-dental":
    case "weight":
    default:
      return "care";
  }
}

const bucketMeta: Record<Bucket, { label: string; icon: typeof Briefcase; color: string; accent: string }> = {
  admin: { label: "Admin", icon: Briefcase, color: "text-pink-700", accent: "border-pink-500 text-pink-700 bg-pink-50" },
  ranch: { label: "Ranch", icon: Tractor, color: "text-amber-700", accent: "border-amber-500 text-amber-700 bg-amber-50" },
  care: { label: "Care", icon: Heart, color: "text-emerald-700", accent: "border-emerald-500 text-emerald-700 bg-emerald-50" },
};

interface FlatTask {
  task: ScheduleTask;
  block: string;
  blockIdx: number;
  taskIdx: number;
}

interface DashboardTaskListProps {
  schedule: ScheduleBlock[];
  onToggle: (blockIdx: number, taskIdx: number) => void;
  onEdit?: (blockIdx: number, taskIdx: number) => void;
  onAdd?: () => void;
}

export default function DashboardTaskList({ schedule, onToggle, onEdit, onAdd }: DashboardTaskListProps) {
  const [activeBucket, setActiveBucket] = useState<Bucket>("ranch");

  // Flatten the schedule and group tasks by bucket.
  const buckets = useMemo(() => {
    const result: Record<Bucket, FlatTask[]> = { admin: [], ranch: [], care: [] };
    schedule.forEach((block, blockIdx) => {
      block.tasks.forEach((task, taskIdx) => {
        const b = bucketForCategory(task.category);
        result[b].push({ task, block: block.name, blockIdx, taskIdx });
      });
    });
    return result;
  }, [schedule]);

  const counts: Record<Bucket, { total: number; remaining: number }> = {
    admin: {
      total: buckets.admin.length,
      remaining: buckets.admin.filter((t) => !t.task.done).length,
    },
    ranch: {
      total: buckets.ranch.length,
      remaining: buckets.ranch.filter((t) => !t.task.done).length,
    },
    care: {
      total: buckets.care.length,
      remaining: buckets.care.filter((t) => !t.task.done).length,
    },
  };

  const visible = buckets[activeBucket];

  return (
    <div className="bg-white rounded-xl border border-card-border flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-card-border shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-sidebar" />
            <h3 className="font-bold text-charcoal text-lg">Task List</h3>
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sidebar border border-card-border rounded-md hover:bg-sidebar hover:text-white hover:border-sidebar transition-colors"
              title="Add a task"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>

        {/* Sub-tabs: Admin / Ranch / Care */}
        <div className="flex gap-1.5">
          {(Object.keys(bucketMeta) as Bucket[]).map((b) => {
            const meta = bucketMeta[b];
            const Icon = meta.icon;
            const isActive = activeBucket === b;
            const count = counts[b];
            return (
              <button
                key={b}
                onClick={() => setActiveBucket(b)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                  isActive
                    ? meta.accent
                    : "border-transparent text-warm-gray hover:bg-cream"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {meta.label}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "" : "text-warm-gray/60"}`}>
                  {count.remaining}/{count.total} left
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list — scrollable */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-warm-gray/60">
              No {bucketMeta[activeBucket].label.toLowerCase()} tasks today.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {visible.map((item) => {
              const isDone = item.task.done;
              return (
                <li key={`${item.blockIdx}-${item.taskIdx}`}>
                  <div
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                      isDone
                        ? "bg-cream/40 border-card-border opacity-60"
                        : "bg-white border-card-border hover:border-sidebar/30 hover:bg-sidebar/5"
                    }`}
                  >
                    <button
                      onClick={() => onToggle(item.blockIdx, item.taskIdx)}
                      title={isDone ? "Mark incomplete" : "Mark done"}
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-warm-gray/30 hover:border-emerald-400"
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>
                    <button
                      onClick={() => onEdit?.(item.blockIdx, item.taskIdx)}
                      disabled={!onEdit}
                      className={`flex-1 min-w-0 text-left ${onEdit ? "cursor-pointer" : "cursor-default"}`}
                      title={onEdit ? "Click to edit" : undefined}
                    >
                      <p
                        className={`text-sm font-medium ${
                          isDone ? "line-through text-warm-gray/60" : "text-charcoal"
                        }`}
                      >
                        {item.task.task}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray/50">
                          {item.block}
                        </span>
                        {item.task.animalSpecific && (
                          <span className="text-[10px] font-medium text-sky-dark">
                            · {item.task.animalSpecific}
                          </span>
                        )}
                        {item.task.assignedTo && (
                          <span className="text-[10px] font-medium text-emerald-700">
                            · {item.task.assignedTo}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer link */}
      <div className="px-5 py-3 border-t border-card-border shrink-0">
        <Link
          href="/app/tasks"
          className="text-xs font-semibold text-sidebar hover:text-sidebar-light"
        >
          Open full task page →
        </Link>
      </div>
    </div>
  );
}
