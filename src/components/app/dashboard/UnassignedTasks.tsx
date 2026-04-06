"use client";

import { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  Plus,
  X,
  Check,
  Zap,
} from "lucide-react";
import {
  categoryMeta,
  sourceMeta,
  type ScheduleTask,
  type ScheduleBlock,
  type TaskCategory,
} from "@/lib/sanctuary-data";
import { volunteers } from "@/lib/volunteer-data";

// ── Team members ──
interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const teamColors = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-indigo-500",
];

const teamMembers: TeamMember[] = volunteers
  .filter((v) => v.status === "active")
  .map((v, i) => ({
    id: v.id,
    name: v.name,
    initials: v.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2),
    color: teamColors[i % teamColors.length],
  }));

function getAssignees(task: ScheduleTask): string[] {
  if (!task.assignedTo) return [];
  return task.assignedTo.split(", ").filter(Boolean);
}

function getMemberByName(name: string): TeamMember | undefined {
  return teamMembers.find(
    (m) => m.name === name || m.initials === name || m.name.split(" ")[0] === name
  );
}

// ── Assign Popover ──
function AssignPopover({
  assignees,
  onToggle,
  onClose,
}: {
  assignees: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg border border-card-border shadow-lg p-2 min-w-[180px]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 px-2 py-1">
        Assign to
      </p>
      {teamMembers.map((m) => {
        const assigned = assignees.includes(m.name);
        return (
          <button
            key={m.id}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(m.name);
            }}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors ${
              assigned ? "bg-emerald-50" : "hover:bg-cream"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${m.color}`}
            >
              {m.initials}
            </span>
            <span className="text-sm text-charcoal flex-1">{m.name}</span>
            {assigned && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Single unassigned task row ──
function UnassignedTaskRow({
  task,
  blockName,
  onAssign,
}: {
  task: ScheduleTask;
  blockName: string;
  onAssign: (name: string) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const meta = categoryMeta[task.category];
  const source = sourceMeta[task.source];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-cream/30 border border-card-border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-charcoal">{task.task}</p>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta.color} ${meta.bg}`}
          >
            {meta.label}
          </span>
          {source.badge && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-sky-dark bg-sky/10 border border-sky/20">
              <Zap className="w-2.5 h-2.5" />
              {source.label}
            </span>
          )}
        </div>
        {task.animalSpecific && (
          <p className="text-[11px] text-sky-dark font-medium mt-0.5">
            {task.animalSpecific}
          </p>
        )}
        <p className="text-[10px] text-warm-gray/60 mt-0.5">{blockName}</p>
      </div>
      <div className="relative shrink-0">
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            popoverOpen
              ? "bg-sidebar text-white"
              : "bg-sky text-white hover:bg-sky-dark"
          }`}
        >
          {popoverOpen ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          Assign
        </button>
        {popoverOpen && (
          <AssignPopover
            assignees={getAssignees(task)}
            onToggle={(name) => {
              onAssign(name);
              setPopoverOpen(false);
            }}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Main component ──
export default function UnassignedTasks({
  schedule,
  onAssign,
}: {
  schedule: ScheduleBlock[];
  onAssign: (blockIdx: number, taskIdx: number, name: string) => void;
}) {
  // Collect all unassigned tasks across all blocks
  const unassigned: { task: ScheduleTask; blockIdx: number; taskIdx: number; blockName: string }[] = [];
  schedule.forEach((block, bi) => {
    block.tasks.forEach((task, ti) => {
      if (!task.assignedTo && !task.done) {
        unassigned.push({ task, blockIdx: bi, taskIdx: ti, blockName: block.name });
      }
    });
  });

  if (unassigned.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-card-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-charcoal text-lg">Unassigned Tasks</h3>
        </div>
        <p className="text-sm text-warm-gray">All tasks are assigned. Nice work!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-charcoal text-lg">Unassigned Tasks</h3>
          <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {unassigned.length}
          </span>
        </div>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {unassigned.map(({ task, blockIdx, taskIdx, blockName }) => (
          <UnassignedTaskRow
            key={`${blockIdx}-${taskIdx}`}
            task={task}
            blockName={blockName}
            onAssign={(name) => onAssign(blockIdx, taskIdx, name)}
          />
        ))}
      </div>
    </div>
  );
}
