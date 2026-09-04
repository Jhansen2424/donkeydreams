"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ListChecks, Check, Plus } from "lucide-react";
import { categoryMeta, type ScheduleBlock, type ScheduleTask, type TaskCategory } from "@/lib/sanctuary-data";
import ExpandableText from "@/components/app/ExpandableText";

// A task's tags, falling back to its legacy single category — same rule the
// Daily Routine page uses, so the two lists always agree.
function taskTags(t: ScheduleTask): TaskCategory[] {
  return t.tags && t.tags.length > 0 ? t.tags : [t.category];
}

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

const BLOCK_ORDER = ["AM", "Mid", "PM"];
const BLOCK_LABELS: Record<string, string> = { AM: "Morning (AM)", Mid: "Midday", PM: "Evening (PM)" };

export default function DashboardTaskList({ schedule, onToggle, onEdit, onAdd }: DashboardTaskListProps) {
  const [activeTag, setActiveTag] = useState<TaskCategory | "all">("all");

  // Flatten the schedule, dropping admin-tagged tasks (those live on the
  // Admin page only). "Until done" (sticky) tasks group separately at the
  // bottom so the time blocks stay about today's shift work.
  const { flat, tagsInUse } = useMemo(() => {
    const flatList: FlatTask[] = [];
    const tagSet = new Set<TaskCategory>();
    schedule.forEach((block, blockIdx) => {
      block.tasks.forEach((task, taskIdx) => {
        const tags = taskTags(task);
        if (tags.includes("admin")) return;
        flatList.push({ task, block: block.name, blockIdx, taskIdx });
        tags.forEach((t) => tagSet.add(t));
      });
    });
    const order = Object.keys(categoryMeta) as TaskCategory[];
    return { flat: flatList, tagsInUse: order.filter((c) => tagSet.has(c) && c !== "admin") };
  }, [schedule]);

  const visible = useMemo(
    () => (activeTag === "all" ? flat : flat.filter((f) => taskTags(f.task).includes(activeTag))),
    [flat, activeTag]
  );

  // Group by time of day, with "until done" standing tasks last.
  const groups = useMemo(() => {
    const byBlock = new Map<string, FlatTask[]>();
    const ongoing: FlatTask[] = [];
    for (const item of visible) {
      if (item.task.sticky) {
        ongoing.push(item);
        continue;
      }
      const arr = byBlock.get(item.block) ?? [];
      arr.push(item);
      byBlock.set(item.block, arr);
    }
    const result: { label: string; items: FlatTask[] }[] = [];
    for (const name of BLOCK_ORDER) {
      const items = byBlock.get(name);
      if (items?.length) result.push({ label: BLOCK_LABELS[name] ?? name, items });
    }
    // Blocks outside the standard three (legacy names) go last, before ongoing.
    for (const [name, items] of byBlock) {
      if (!BLOCK_ORDER.includes(name) && items.length) result.push({ label: name, items });
    }
    if (ongoing.length) result.push({ label: "Ongoing — until done", items: ongoing });
    return result;
  }, [visible]);

  const remaining = flat.filter((t) => !t.task.done).length;

  return (
    <div className="bg-white rounded-xl border border-card-border flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-card-border shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-sidebar" />
            <h3 className="font-bold text-charcoal text-lg">Task List</h3>
            <span className="text-xs font-medium text-warm-gray">
              {remaining}/{flat.length} left
            </span>
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

        {/* Tag filter pills — same tags as the Daily Routine page. */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTag("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              activeTag === "all"
                ? "bg-sidebar text-white border-sidebar"
                : "bg-white text-charcoal border-card-border hover:bg-cream"
            }`}
          >
            All
          </button>
          {tagsInUse.map((tag) => {
            const meta = categoryMeta[tag];
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag((cur) => (cur === tag ? "all" : tag))}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-sidebar text-white border-sidebar"
                    : `bg-white border-card-border hover:bg-cream ${meta.color}`
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list — scrollable, grouped AM / Mid / PM / Ongoing */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-warm-gray/60">
              {activeTag === "all"
                ? "No tasks today."
                : `No ${categoryMeta[activeTag].label.toLowerCase()} tasks today.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-warm-gray/60 px-1 mb-1">
                  {group.label}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((item) => {
                    const isDone = item.task.done;
                    return (
                      <li key={item.task.serverId ?? `${item.blockIdx}-${item.taskIdx}`}>
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
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => onEdit?.(item.blockIdx, item.taskIdx)}
                              disabled={!onEdit}
                              className={`block w-full text-left ${onEdit ? "cursor-pointer" : "cursor-default"}`}
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
                                {taskTags(item.task).map((tag) => {
                                  const meta = categoryMeta[tag];
                                  if (!meta) return null;
                                  return (
                                    <span
                                      key={tag}
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.color} ${meta.bg}`}
                                    >
                                      {meta.label}
                                    </span>
                                  );
                                })}
                                {item.task.animalSpecific && (
                                  <span className="text-[10px] font-medium text-sky-dark">
                                    {item.task.animalSpecific}
                                  </span>
                                )}
                                {item.task.assignedTo && (
                                  <span className="text-[10px] font-medium text-emerald-700">
                                    {item.task.assignedTo}
                                  </span>
                                )}
                              </div>
                            </button>
                            {item.task.note && (
                              <div className="mt-0.5">
                                <ExpandableText
                                  text={item.task.note}
                                  className="text-[11px] text-warm-gray italic"
                                  clampChars={150}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
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
