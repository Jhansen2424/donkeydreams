"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Clock,
  Check,
  RotateCcw,
  Info,
  Zap,
  ListChecks,
  User,
  Filter,
  Search,
  Plus,
  X,
  UserPlus,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Printer,
  Repeat,
  CheckSquare,
} from "lucide-react";
import {
  groupTasksByAnimal,
  saltsAndMinerals,
  categoryMeta,
  sourceMeta,
  type ScheduleTask,
  type ScheduleBlock,
  type TaskCategory,
} from "@/lib/sanctuary-data";
import { volunteers } from "@/lib/volunteer-data";
import { useSchedule, localToday } from "@/lib/schedule-context";
import { formatDate } from "@/lib/format-date";
import { useParkingLot } from "@/lib/parking-lot-context";
import VolunteerLoadBar from "@/components/app/VolunteerLoadBar";
import TaskEditModal, { type TaskEditModalMode } from "@/components/app/TaskEditModal";
import ExpandableText, { normalizeParagraphs } from "@/components/app/ExpandableText";
import { Trash2 } from "lucide-react";

type ViewMode = "time" | "animal" | "human";
type CategoryFilter = TaskCategory | "all";
type HumanFilter = string | "all";

// ── Team members (active admins + volunteers) ──
interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: "admin" | "volunteer";
  color: string;
}

const teamColors = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
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
    role: v.role,
    color: teamColors[i % teamColors.length],
  }));

// ── Helpers ──

function getAssignees(task: ScheduleTask): string[] {
  if (!task.assignedTo) return [];
  return task.assignedTo.split(", ").filter(Boolean);
}

function getMemberByName(name: string): TeamMember | undefined {
  return teamMembers.find(
    (m) => m.name === name || m.initials === name || m.name.split(" ")[0] === name
  );
}

// Shift a YYYY-MM-DD date by whole days, in local time.
function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

// A task's tags, falling back to its legacy single category.
function taskTags(t: ScheduleTask): TaskCategory[] {
  return t.tags && t.tags.length > 0 ? t.tags : [t.category];
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
      {assignees.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Clear all
            assignees.forEach((a) => onToggle(a));
          }}
          className="w-full text-xs text-red-500 font-medium px-2 py-1.5 mt-1 border-t border-card-border hover:bg-red-50 rounded-md transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ── Assign Chips ──

function AssignChips({
  task,
  onAssign,
}: {
  task: ScheduleTask;
  onAssign: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const assignees = getAssignees(task);

  return (
    <div className="relative flex items-center gap-1 flex-wrap mt-1.5 print:hidden">
      {assignees.map((name) => {
        const member = getMemberByName(name);
        return (
          <span
            key={name}
            title={member?.name || name}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shrink-0 ${
              member?.color || "bg-gray-400"
            }`}
          >
            {member?.initials || name.slice(0, 2)}
          </span>
        );
      })}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed transition-colors shrink-0 ${
          open
            ? "border-sidebar bg-sidebar/10 text-sidebar"
            : "border-card-border text-warm-gray/40 hover:border-sand hover:text-warm-gray"
        }`}
        title="Assign team member"
      >
        {open ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
      </button>
      {open && (
        <AssignPopover
          assignees={assignees}
          onToggle={(name) => onAssign(name)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── Page ──

export default function TasksPage() {
  const {
    schedule,
    toggleTask,
    assignTask,
    bulkAssign,
    editTask,
    reorderTask,
    setOutcome,
    bulkComplete,
    bulkMove,
    bulkAssignTo,
    bulkDelete,
    resetSchedule,
    refresh,
    currentDate,
  } = useSchedule();
  const [viewMode, setViewMode] = useState<ViewMode>("time");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [humanFilter, setHumanFilter] = useState<HumanFilter>("all");
  const [search, setSearch] = useState("");
  // Identifier of the card currently being dragged. Encoded as
  // `${blockIdx}:${taskIdx}` so the drop handler can locate the source.
  const [dragSource, setDragSource] = useState<{ blockIdx: number; taskIdx: number } | null>(null);
  const [dropTargetBlock, setDropTargetBlock] = useState<number | null>(null);
  // Row hovered during a same-block drag — where the card will be dropped.
  const [dropTargetRow, setDropTargetRow] = useState<{ blockIdx: number; taskIdx: number } | null>(null);
  // Multi-select: tap "Select", then tap tasks to check off / move / assign /
  // remove several at once (client 9/24).
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
    setBulkAssignOpen(false);
  };

  const viewingToday = currentDate === localToday();

  // The provider is shared with the dashboard, which should always show local
  // today. If the user navigates away while viewing another date, snap the
  // shared schedule back to today on unmount.
  const currentDateRef = useRef(currentDate);
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);
  useEffect(() => {
    return () => {
      if (currentDateRef.current !== localToday()) void refresh(localToday());
    };
  }, [refresh]);

  // Admin-tagged tasks live on the Admin page only — they never appear in
  // the daily routine views (or its progress counts).
  const routineSchedule = useMemo(
    () =>
      schedule.map((block) => ({
        ...block,
        tasks: block.tasks.filter((t) => !taskTags(t).includes("admin")),
      })),
    [schedule]
  );

  const totalTasks = routineSchedule.reduce((s, b) => s + b.tasks.length, 0);
  const doneTasks = routineSchedule.reduce(
    (s, b) => s + b.tasks.filter((t) => t.done).length,
    0
  );
  const totalMinutes = routineSchedule.reduce(
    (s, b) => s + b.tasks.reduce((ts, t) => ts + (t.estimatedMinutes ?? 0), 0),
    0
  );
  const autoGenCount = routineSchedule.reduce(
    (s, b) => s + b.tasks.filter((t) => t.source !== "base").length,
    0
  );
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Filter chips render only the tags actually in use today, so the row
  // stays uncluttered and always matches what's on the list.
  const tagsInUse = useMemo(() => {
    const set = new Set<TaskCategory>();
    for (const b of routineSchedule) for (const t of b.tasks) for (const tag of taskTags(t)) set.add(tag);
    const order = Object.keys(categoryMeta) as TaskCategory[];
    return order.filter((c) => set.has(c) && c !== "admin");
  }, [routineSchedule]);

  const taskMatchesSearch = (t: ScheduleTask) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.task.toLowerCase().includes(q) ||
      (t.animalSpecific?.toLowerCase().includes(q) ?? false) ||
      (t.note?.toLowerCase().includes(q) ?? false) ||
      (t.assignedTo?.toLowerCase().includes(q) ?? false) ||
      taskTags(t).some((tag) => categoryMeta[tag]?.label.toLowerCase().includes(q)) ||
      sourceMeta[t.source].label.toLowerCase().includes(q)
    );
  };

  const filteredSchedule = useMemo(() => {
    return routineSchedule.map((block) => ({
      ...block,
      tasks: block.tasks.filter((t) => {
        // A task matches a filter chip when ANY of its tags matches.
        if (categoryFilter !== "all" && !taskTags(t).includes(categoryFilter)) return false;
        if (humanFilter !== "all") {
          const assignees = getAssignees(t);
          if (!assignees.includes(humanFilter)) return false;
        }
        return taskMatchesSearch(t);
      }),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineSchedule, categoryFilter, humanFilter, search]);

  const animalGroups = useMemo(
    () => groupTasksByAnimal(filteredSchedule),
    [filteredSchedule]
  );

  // Recover a task's index in the unfiltered schedule. Uses the stable DB id
  // (serverId) so duplicate task texts don't collapse onto the same row; the
  // text+animal match is only a fallback for tasks without an id.
  const findTaskIdx = (blockIdx: number, task: ScheduleTask): number =>
    schedule[blockIdx]?.tasks.findIndex((t) =>
      task.serverId
        ? t.serverId === task.serverId
        : t.task === task.task && t.animalSpecific === task.animalSpecific
    ) ?? -1;

  // Group filtered tasks by assigned human. An unassigned task shows up
  // under a synthetic "Unassigned" bucket so it doesn't disappear.
  const humanGroups = useMemo(() => {
    const map = new Map<string, { task: ScheduleTask; block: string; blockIdx: number; taskIdx: number }[]>();
    filteredSchedule.forEach((block) => {
      const origBlockIdx = schedule.findIndex((b) => b.name === block.name);
      block.tasks.forEach((task) => {
        const origTaskIdx = schedule[origBlockIdx]?.tasks.findIndex(
          (t) =>
            task.serverId
              ? t.serverId === task.serverId
              : t.task === task.task && t.animalSpecific === task.animalSpecific
        ) ?? -1;
        const assignees = getAssignees(task);
        const targets = assignees.length > 0 ? assignees : ["Unassigned"];
        targets.forEach((name) => {
          if (!map.has(name)) map.set(name, []);
          map.get(name)!.push({ task, block: block.name, blockIdx: origBlockIdx, taskIdx: origTaskIdx });
        });
      });
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [filteredSchedule, schedule]);

  const filteredTotal = filteredSchedule.reduce((s, b) => s + b.tasks.length, 0);

  // Bulk assign popover state
  const [bulkPopoverBlock, setBulkPopoverBlock] = useState<number | null>(null);

  // Task edit / add modal state
  const [modalMode, setModalMode] = useState<TaskEditModalMode | null>(null);
  const openAdd = (defaultBlock?: string) =>
    setModalMode({ kind: "add", defaultBlock });
  const openEdit = (blockIdx: number, taskIdx: number) => {
    const block = schedule[blockIdx];
    const task = block?.tasks[taskIdx];
    if (!block || !task) return;
    setModalMode({
      kind: "edit",
      blockIdx,
      taskIdx,
      task,
      defaultBlock: block.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Print-only heading — names the viewed day on the hard copy. */}
      <div className="hidden print:block border-b-2 border-charcoal pb-2">
        <h1 className="text-2xl font-bold text-charcoal">
          Daily Routine — {formatDate(currentDate)}
        </h1>
        <p className="text-sm text-charcoal mt-0.5">
          {doneTasks}/{totalTasks} tasks complete
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Daily Routine</h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {doneTasks}/{totalTasks} tasks complete · {pct}% done · ~{Math.round(totalMinutes / 60)}h total
            {autoGenCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-sky-dark">
                <Zap className="w-3 h-3" />
                {autoGenCount} auto-generated
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day navigation — view / add tasks for any date */}
          <div className="inline-flex items-center bg-white border border-card-border rounded-lg overflow-hidden">
            <button
              onClick={() => void refresh(shiftDate(currentDate, -1))}
              className="px-2 py-2 text-charcoal hover:bg-cream transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => {
                if (e.target.value) void refresh(e.target.value);
              }}
              className="px-2 py-1.5 text-sm text-charcoal bg-white border-x border-card-border focus:outline-none"
              title="Jump to a date"
            />
            <button
              onClick={() => void refresh(shiftDate(currentDate, 1))}
              className="px-2 py-2 text-charcoal hover:bg-cream transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
            title="Print this day's routine (or save as PDF)"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <a
            href="/app/tasks/history"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
            title="What was done, missed, or refused on past days"
          >
            <RotateCcw className="w-4 h-4" />
            History
          </a>
          <div className="inline-flex bg-white border border-card-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("time")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "time"
                  ? "bg-sidebar text-white"
                  : "text-charcoal hover:bg-cream"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              By Time
            </button>
            <button
              onClick={() => setViewMode("animal")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "animal"
                  ? "bg-sidebar text-white"
                  : "text-charcoal hover:bg-cream"
              }`}
            >
              <User className="w-4 h-4" />
              By Animal
            </button>
            <button
              onClick={() => setViewMode("human")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "human"
                  ? "bg-sidebar text-white"
                  : "text-charcoal hover:bg-cream"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              By Human
            </button>
          </div>
          <button
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              selectMode
                ? "bg-sky text-white border-sky"
                : "bg-white border-card-border text-charcoal hover:bg-cream"
            }`}
            title="Tap tasks to select several, then complete / move / assign them at once"
          >
            <CheckSquare className="w-4 h-4" />
            {selectMode ? "Done selecting" : "Select"}
          </button>
          <button
            onClick={() => openAdd()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-bold hover:bg-sidebar-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
          <button
            onClick={resetSchedule}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
            title="Reload tasks from database"
          >
            <RotateCcw className="w-4 h-4" />
            Reload
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-card-border p-4 print:hidden">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-charcoal">
            {viewingToday ? <>Today&apos;s Progress</> : <>Progress for {currentDate}</>}
          </p>
          <p className="text-sm font-bold text-charcoal">{pct}%</p>
        </div>
        <div className="w-full bg-cream rounded-full h-3">
          <div
            className="bg-gradient-to-r from-sky to-sky-dark h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Team legend — click a name to filter by that person */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60">By Human:</span>
        <button
          onClick={() => setHumanFilter("all")}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            humanFilter === "all"
              ? "bg-sidebar text-white border-sidebar"
              : "bg-white text-charcoal border-card-border hover:bg-cream"
          }`}
        >
          All
        </button>
        {teamMembers.map((m) => {
          const active = humanFilter === m.name;
          return (
            <button
              key={m.id}
              onClick={() => setHumanFilter((cur) => (cur === m.name ? "all" : m.name))}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-sidebar text-white border-sidebar"
                  : "bg-white text-charcoal border-card-border hover:bg-cream"
              }`}
              title={`Show tasks assigned to ${m.name}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${m.color}`}
              >
                {m.initials}
              </span>
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Volunteer workload */}
      <div className="print:hidden">
        <VolunteerLoadBar schedule={schedule} />
      </div>

      {/* Search + category filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
          <input
            type="text"
            placeholder="Search donkey, task, treatment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray/50 hover:text-charcoal"
            >
              ✕
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-warm-gray">
            {filteredTotal} task{filteredTotal !== 1 ? "s" : ""} match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Filter className="w-4 h-4 text-warm-gray" />
        <FilterPill
          label="All"
          active={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
        />
        {tagsInUse.map((cat) => (
          <FilterPill
            key={cat}
            label={categoryMeta[cat].label}
            active={categoryFilter === cat}
            onClick={() => setCategoryFilter((cur) => (cur === cat ? "all" : cat))}
            dotColor={categoryMeta[cat].color}
          />
        ))}
      </div>

      {/* ═══ BY TIME VIEW ═══ */}
      {/* Mobile jump bar — on phones the three blocks stack, so PM lives a
          long scroll away (client 9/23). Sticky AM/Mid/PM buttons jump
          straight to each block. Hidden on desktop (columns sit side by
          side there). */}
      {viewMode === "time" && (
        <div className="lg:hidden sticky top-2 z-30 print:hidden">
          <div className="flex gap-1.5 bg-white/95 backdrop-blur border border-card-border rounded-xl p-1.5 shadow-sm">
            {filteredSchedule.map((block) => {
              const done = block.tasks.filter((t) => t.done).length;
              return (
                <button
                  key={block.name}
                  onClick={() =>
                    document
                      .getElementById(`block-${block.name}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="flex-1 py-2 rounded-lg text-sm font-bold bg-cream text-charcoal hover:bg-sand/40 transition-colors"
                >
                  {block.name}
                  <span className="ml-1.5 text-[11px] font-semibold text-warm-gray">
                    {done}/{block.tasks.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {viewMode === "time" && (
        <div className="grid lg:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
          {filteredSchedule.map((block, _fi) => {
            const origIdx = schedule.findIndex((b) => b.name === block.name);
            const isDropTarget = dropTargetBlock === origIdx && dragSource && dragSource.blockIdx !== origIdx;
            // Highlight the block that matches the current time of day, so
            // the crew works AM before Mid before PM.
            const isNow =
              viewingToday &&
              block.name ===
                (new Date().getHours() < 10 ? "AM" : new Date().getHours() < 16 ? "Mid" : "PM");
            return (
              <div
                key={block.name}
                id={`block-${block.name}`}
                onDragOver={(e) => {
                  if (dragSource && dragSource.blockIdx !== origIdx) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dropTargetBlock !== origIdx) setDropTargetBlock(origIdx);
                  }
                }}
                onDragLeave={(e) => {
                  // Only clear if we're really leaving the block — React fires
                  // dragleave when moving between children, so compare against
                  // currentTarget.
                  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                    setDropTargetBlock((cur) => (cur === origIdx ? null : cur));
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDropTargetBlock(null);
                  // Same-block drops are handled per-row (reorder); this
                  // block-level handler only moves tasks BETWEEN blocks.
                  // applyToSeries: dragging a repeating task to another block
                  // moves the whole routine, matching every other edit's
                  // default — without it the task snapped back the next day.
                  if (!dragSource || dragSource.blockIdx === origIdx) return;
                  await editTask(
                    dragSource.blockIdx,
                    dragSource.taskIdx,
                    { blockName: block.name },
                    { applyToSeries: true }
                  );
                  setDragSource(null);
                }}
                className={`bg-white rounded-xl border transition-colors scroll-mt-20 ${
                  isDropTarget
                    ? "border-sidebar ring-2 ring-sidebar/30"
                    : isNow
                      ? "border-sky ring-2 ring-sky/25"
                      : "border-card-border"
                }`}
              >
                {/* NOTE: the card must NOT be overflow-hidden — the assign
                    popover (+ button) renders outside the card bounds and
                    was getting clipped behind neighboring columns (client
                    9/22). The header carries its own top rounding instead. */}
                <div className="bg-sidebar rounded-t-xl px-5 py-3 print:bg-transparent print:border-b-2 print:border-charcoal print:px-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-white print:text-charcoal flex items-center gap-2">
                        {block.name}
                        {isNow && (
                          <span className="print:hidden inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky text-white uppercase tracking-wide">
                            Now
                          </span>
                        )}
                      </h2>
                      <p className="text-cream/60 text-xs print:text-charcoal">{block.time}</p>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                      {selectMode && (
                        <button
                          onClick={() => {
                            const ids = block.tasks
                              .map((t) => t.serverId)
                              .filter((id): id is string => Boolean(id));
                            setSelected((prev) => {
                              const allIn = ids.every((id) => prev.has(id));
                              const next = new Set(prev);
                              ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-cream/70 hover:text-white hover:bg-white/10 transition-colors"
                          title={`Select every ${block.name} task`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Select all
                        </button>
                      )}
                      {/* Bulk assign button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setBulkPopoverBlock(
                              bulkPopoverBlock === origIdx ? null : origIdx
                            )
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-cream/70 hover:text-white hover:bg-white/10 transition-colors"
                          title={`Assign all ${block.name} tasks`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Assign all
                        </button>
                        {bulkPopoverBlock === origIdx && (
                          <BulkAssignPopover
                            onAssign={(name) => {
                              bulkAssign(origIdx, name);
                              setBulkPopoverBlock(null);
                            }}
                            onClose={() => setBulkPopoverBlock(null)}
                          />
                        )}
                      </div>
                      {/* Check off every remaining task in this block at once
                          (client request 9/20: "select all and mark complete"). */}
                      {schedule[origIdx]?.tasks.some((t) => !t.done) && (
                        <button
                          onClick={() => {
                            schedule[origIdx].tasks.forEach((t, ti) => {
                              if (!t.done) void toggleTask(origIdx, ti);
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-cream/70 hover:text-white hover:bg-white/10 transition-colors"
                          title={`Mark every ${block.name} task done`}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          All done
                        </button>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cream/40" />
                        <span className="text-cream/70 text-sm font-medium">
                          {block.tasks.filter((t) => t.done).length}/
                          {block.tasks.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {block.tasks.map((task, taskIdx) => {
                    const origTaskIdx = findTaskIdx(origIdx, task);
                    const isRowDropTarget =
                      dragSource !== null &&
                      dragSource.blockIdx === origIdx &&
                      dragSource.taskIdx !== origTaskIdx &&
                      dropTargetRow?.blockIdx === origIdx &&
                      dropTargetRow.taskIdx === origTaskIdx;
                    return (
                      <TaskRow
                        key={task.serverId ?? `${block.name}-${taskIdx}`}
                        task={task}
                        selectMode={selectMode}
                        isSelected={Boolean(task.serverId && selected.has(task.serverId))}
                        onSelectToggle={() => task.serverId && toggleSelected(task.serverId)}
                        onToggle={() => toggleTask(origIdx, origTaskIdx)}
                        onAssign={(name) =>
                          assignTask(origIdx, origTaskIdx, name)
                        }
                        onEdit={() => openEdit(origIdx, origTaskIdx)}
                        onOutcome={(o, n) => void setOutcome(origIdx, origTaskIdx, o, n)}
                        onDragStart={() => setDragSource({ blockIdx: origIdx, taskIdx: origTaskIdx })}
                        onDragEnd={() => {
                          setDragSource(null);
                          setDropTargetBlock(null);
                          setDropTargetRow(null);
                        }}
                        onDragOverRow={(e) => {
                          // Same-block drag: hovering a row marks where the
                          // card will land on drop.
                          if (dragSource && dragSource.blockIdx === origIdx) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (
                              dropTargetRow?.blockIdx !== origIdx ||
                              dropTargetRow.taskIdx !== origTaskIdx
                            ) {
                              setDropTargetRow({ blockIdx: origIdx, taskIdx: origTaskIdx });
                            }
                          }
                        }}
                        onDropRow={async (e) => {
                          if (!dragSource || dragSource.blockIdx !== origIdx) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const from = dragSource.taskIdx;
                          setDragSource(null);
                          setDropTargetRow(null);
                          if (from >= 0 && origTaskIdx >= 0 && from !== origTaskIdx) {
                            await reorderTask(origIdx, from, origTaskIdx);
                          }
                        }}
                        isDropTarget={isRowDropTarget}
                      />
                    );
                  })}
                  {block.tasks.length === 0 && (
                    <p className="text-sm text-warm-gray/50 text-center py-3">
                      No tasks yet
                    </p>
                  )}
                  <button
                    onClick={() => openAdd(block.name)}
                    className="print:hidden mt-1 w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-sidebar border-2 border-dashed border-card-border rounded-lg hover:border-sidebar hover:bg-sidebar/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to {block.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ BY ANIMAL VIEW ═══ */}
      {viewMode === "animal" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {animalGroups.map((group) => {
              const done = group.tasks.filter((t) => t.task.done).length;
              const total = group.tasks.length;
              return (
                <div
                  key={group.animal}
                  className="bg-white rounded-xl border border-card-border"
                >
                  <div className="bg-sidebar rounded-t-xl px-5 py-3 flex items-center justify-between print:bg-transparent print:border-b-2 print:border-charcoal print:px-0">
                    <h2 className="font-bold text-white print:text-charcoal">{group.animal}</h2>
                    <span className="text-cream/70 text-sm font-medium print:text-charcoal">
                      {done}/{total}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {group.tasks.map(({ task, block }, idx) => {
                      const blockIdx = schedule.findIndex(
                        (b) => b.name === block
                      );
                      const taskIdx = findTaskIdx(blockIdx, task);
                      return (
                        <div key={task.serverId ?? idx}>
                          <p className="text-[10px] font-semibold text-warm-gray/50 uppercase tracking-wider mb-0.5 ml-8">
                            {block}
                          </p>
                          <TaskRow
                            task={task}
                            onToggle={() => {
                              if (blockIdx >= 0 && taskIdx >= 0) {
                                toggleTask(blockIdx, taskIdx);
                              }
                            }}
                            onAssign={(name) => {
                              if (blockIdx >= 0 && taskIdx >= 0) {
                                assignTask(blockIdx, taskIdx, name);
                              }
                            }}
                            onEdit={
                              blockIdx >= 0 && taskIdx >= 0
                                ? () => openEdit(blockIdx, taskIdx)
                                : undefined
                            }
                            onOutcome={
                              blockIdx >= 0 && taskIdx >= 0
                                ? (o, n) => void setOutcome(blockIdx, taskIdx, o, n)
                                : undefined
                            }
                            hideAnimal
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {animalGroups.length === 0 && (
              <p className="text-sm text-warm-gray/50 col-span-full text-center py-8">
                {search
                  ? <>No animals match &ldquo;{search}&rdquo;</>
                  : "No animal-specific tasks for this filter"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ BY HUMAN VIEW ═══ */}
      {viewMode === "human" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {humanGroups.map(([name, items]) => {
              const member = getMemberByName(name);
              const done = items.filter((it) => it.task.done).length;
              const total = items.length;
              return (
                <div key={name} className="bg-white rounded-xl border border-card-border">
                  <div className="bg-sidebar rounded-t-xl px-5 py-3 flex items-center justify-between print:bg-transparent print:border-b-2 print:border-charcoal print:px-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                          member?.color || "bg-gray-400"
                        }`}
                      >
                        {member?.initials || name.slice(0, 2)}
                      </span>
                      <h2 className="font-bold text-white print:text-charcoal">{name}</h2>
                    </div>
                    <span className="text-cream/70 text-sm font-medium print:text-charcoal">
                      {done}/{total}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {items.map(({ task, block, blockIdx, taskIdx }, idx) => (
                      <div key={task.serverId ?? idx}>
                        <p className="text-[10px] font-semibold text-warm-gray/50 uppercase tracking-wider mb-0.5 ml-8">
                          {block}
                        </p>
                        <TaskRow
                          task={task}
                          onToggle={() => {
                            if (blockIdx >= 0 && taskIdx >= 0) toggleTask(blockIdx, taskIdx);
                          }}
                          onAssign={(n) => {
                            if (blockIdx >= 0 && taskIdx >= 0) assignTask(blockIdx, taskIdx, n);
                          }}
                          onEdit={
                            blockIdx >= 0 && taskIdx >= 0
                              ? () => openEdit(blockIdx, taskIdx)
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {humanGroups.length === 0 && (
              <p className="text-sm text-warm-gray/50 col-span-full text-center py-8">
                No tasks match the current filters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming (future-dated) tasks */}
      <div className="print:hidden">
        <UpcomingTasksCard />
      </div>

      {/* Reminders — the old Alley Herd Rotation card was removed (no
          rotation at the new property, per Amber). */}
      <div className="grid sm:grid-cols-2 gap-4 print:hidden">
        <RemindersCard />
      </div>

      {/* Multi-select action bar — floats over the page while tasks are
          selected. Everything acts on the checked tasks at once. */}
      {selectMode && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 print:hidden w-[calc(100%-1.5rem)] sm:w-auto">
          <div className="bg-sidebar text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm font-bold whitespace-nowrap">
              {selected.size} selected
            </span>
            <button
              disabled={selected.size === 0 || bulkBusy}
              onClick={async () => {
                setBulkBusy(true);
                try {
                  await bulkComplete([...selected]);
                  setSelected(new Set());
                } finally {
                  setBulkBusy(false);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark done
            </button>
            <span className="inline-flex items-center gap-1">
              <span className="text-[11px] text-cream/70 font-medium mr-0.5">Move to</span>
              {["AM", "Mid", "PM"].map((b) => (
                <button
                  key={b}
                  disabled={selected.size === 0 || bulkBusy}
                  onClick={async () => {
                    setBulkBusy(true);
                    try {
                      await bulkMove([...selected], b);
                    } finally {
                      setBulkBusy(false);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/25 disabled:opacity-40 transition-colors"
                >
                  {b}
                </button>
              ))}
            </span>
            <span className="relative">
              <button
                disabled={selected.size === 0 || bulkBusy}
                onClick={() => setBulkAssignOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/25 disabled:opacity-40 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign
              </button>
              {bulkAssignOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-lg border border-card-border shadow-lg p-2 min-w-[170px]">
                  {teamMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={async () => {
                        setBulkAssignOpen(false);
                        setBulkBusy(true);
                        try {
                          await bulkAssignTo([...selected], m.name);
                        } finally {
                          setBulkBusy(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-cream transition-colors"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${m.color}`}
                      >
                        {m.initials}
                      </span>
                      <span className="text-sm text-charcoal">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </span>
            <button
              disabled={selected.size === 0 || bulkBusy}
              onClick={async () => {
                const n = selected.size;
                if (
                  !window.confirm(
                    `Remove ${n} task${n === 1 ? "" : "s"} from this day? Repeating tasks come back on their next scheduled day.`
                  )
                )
                  return;
                setBulkBusy(true);
                try {
                  await bulkDelete([...selected]);
                  setSelected(new Set());
                } finally {
                  setBulkBusy(false);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/90 rounded-lg text-xs font-bold hover:bg-red-600 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
            <button
              onClick={exitSelectMode}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-cream/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task add / edit modal */}
      {modalMode && (
        <TaskEditModal
          open={modalMode !== null}
          mode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}

// ── Reminders Card ──
// Persistent, editable reminders list. Backed by parking-lot entries with
// type "reminder" so they survive reloads and show up wherever parking-lot
// data is consulted. Seed reminders (salts & minerals, teff, supplement drops)
// still render when no user reminders exist yet.

// Seed reminders used to be rendered always-on. Now they're dismissable —
// we track dismissed ids in localStorage so the card doesn't refill them on
// reload. Staff can re-enable any seed reminder by clearing localStorage;
// in practice they're starter content, meant to be curated away as the
// team builds their own list.
const SEED_REMINDERS_KEY = "dd:dismissed-seed-reminders:v1";
const SEED_REMINDERS = [
  {
    id: "seed-salts",
    render: (
      <>
        <p className="text-sm font-medium text-amber-800">Salts &amp; Minerals</p>
        <p className="text-sm text-amber-700">
          {saltsAndMinerals.days.join(" & ")}
        </p>
      </>
    ),
    className: "bg-amber-50 border-amber-200",
  },
  {
    id: "seed-teff",
    render: (
      <p className="text-sm text-charcoal">
        Teff is powdery — make sure buckets are moist when served.
      </p>
    ),
    className: "bg-sky/5 border-sky/20",
  },
  {
    id: "seed-supplements",
    render: (
      <p className="text-sm text-red-800">
        Check the ground when giving supplements — pills can drop.
        Especially Shelley + Winnie.
      </p>
    ),
    className: "bg-red-50 border-red-200",
  },
];

function loadDismissedSeedReminders(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEED_REMINDERS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDismissedSeedReminders(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEED_REMINDERS_KEY, JSON.stringify([...ids]));
  } catch {
    /* localStorage full / private mode — we just can't persist dismissals. */
  }
}

function RemindersCard() {
  const { entries, addEntry, removeEntry, resolveEntry, unresolveEntry } = useParkingLot();
  const { addTask } = useSchedule();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [crossedSeeds, setCrossedSeeds] = useState<Set<string>>(new Set());

  // Hydrate crossed-out seed reminders from localStorage on mount. (This
  // reuses the old "dismissed" key, so previously dismissed seeds come back
  // crossed out instead of gone.)
  useEffect(() => {
    setCrossedSeeds(loadDismissedSeedReminders());
  }, []);

  // Crossed-out (resolved) reminders stay visible with a strikethrough —
  // clicking again un-crosses them. Nothing is deleted by accident.
  const userReminders = entries.filter((e) => e.type === "reminder");

  function toggleSeed(id: string) {
    setCrossedSeeds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveDismissedSeedReminders(next);
      return next;
    });
  }

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await addEntry("reminder", text);
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  // Promote a reminder to a real task on today's schedule (routine category
  // by default). The reminder is then resolved so it doesn't linger in both
  // places.
  async function promoteReminderToTask(id: string, text: string) {
    addTask({
      task: text,
      blockName: (() => {
        const h = new Date().getHours();
        if (h < 10) return "AM";
        if (h < 16) return "Mid";
        return "PM";
      })(),
      category: "routine",
    });
    await removeEntry(id);
  }

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <h3 className="font-bold text-charcoal mb-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-sky" />
        Reminders
      </h3>
      <div className="space-y-3">
        {/* Seed reminders — useful defaults that don't live in the DB.
            Clicking the X crosses them out; clicking again restores them. */}
        {SEED_REMINDERS.map((seed) => {
          const crossed = crossedSeeds.has(seed.id);
          return (
            <div
              key={seed.id}
              className={`p-3 border rounded-lg flex items-start gap-2 ${seed.className} ${
                crossed ? "opacity-50" : ""
              }`}
            >
              <div className={`flex-1 ${crossed ? "line-through" : ""}`}>{seed.render}</div>
              <button
                onClick={() => toggleSeed(seed.id)}
                className="text-warm-gray/50 hover:text-charcoal transition-colors shrink-0 mt-0.5"
                title={crossed ? "Restore this reminder" : "Cross out this reminder"}
              >
                {crossed ? <RotateCcw className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}

        {/* User-added reminders. X crosses out (reversible); the trash icon
            only appears on crossed-out reminders for permanent cleanup. */}
        {userReminders.map((r) => (
          <div
            key={r.id}
            className={`p-3 bg-cream/60 border border-card-border rounded-lg flex items-start gap-2 group ${
              r.resolved ? "opacity-50" : ""
            }`}
          >
            <p className={`text-sm text-charcoal flex-1 ${r.resolved ? "line-through" : ""}`}>
              {r.text}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {!r.resolved && (
                <button
                  onClick={() => void promoteReminderToTask(r.id, r.text)}
                  className="text-warm-gray/50 hover:text-sky transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Promote to task on today's schedule"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => (r.resolved ? unresolveEntry(r.id) : resolveEntry(r.id))}
                className="text-warm-gray/50 hover:text-charcoal transition-colors"
                title={r.resolved ? "Restore reminder" : "Cross out reminder"}
              >
                {r.resolved ? <RotateCcw className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </button>
              {r.resolved && (
                <button
                  onClick={() => removeEntry(r.id)}
                  className="text-warm-gray/50 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add reminder */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAdd();
              }
            }}
            placeholder="Add a reminder..."
            className="flex-1 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
          />
          <button
            onClick={() => void handleAdd()}
            disabled={!draft.trim() || saving}
            className="inline-flex items-center gap-1 px-3 py-2 bg-sidebar text-white rounded-lg text-xs font-semibold hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Assign Popover ──

function BulkAssignPopover({
  onAssign,
  onClose,
}: {
  onAssign: (name: string) => void;
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
        Assign all tasks to
      </p>
      {teamMembers.map((m) => (
        <button
          key={m.id}
          onClick={(e) => {
            e.stopPropagation();
            onAssign(m.name);
          }}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left hover:bg-cream transition-colors"
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${m.color}`}
          >
            {m.initials}
          </span>
          <span className="text-sm text-charcoal">{m.name}</span>
        </button>
      ))}
    </div>
  );
}

// ── Task Row Component ──

function TaskRow({
  task,
  onToggle,
  onAssign,
  onEdit,
  onOutcome,
  hideAnimal,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDropRow,
  isDropTarget,
  selectMode,
  isSelected,
  onSelectToggle,
}: {
  task: ScheduleTask;
  onToggle: () => void;
  onAssign: (name: string) => void;
  onEdit?: () => void;
  /** Record how it went ("" / partial / refused / issue + why). */
  onOutcome?: (outcome: "" | "partial" | "refused" | "issue", note: string) => void;
  hideAnimal?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOverRow?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDropRow?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDropTarget?: boolean;
  /** Multi-select mode: the whole row toggles selection instead of its
      normal actions (drag/edit are paused while selecting). */
  selectMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
}) {
  const source = sourceMeta[task.source];
  const draggable = Boolean(onDragStart) && !selectMode;
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [outcomeDraft, setOutcomeDraft] = useState<"partial" | "refused" | "issue">("partial");
  const [outcomeNoteDraft, setOutcomeNoteDraft] = useState("");

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        // Required to trigger drag on Firefox.
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.task);
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={onDragOverRow}
      onDrop={onDropRow}
      onClick={selectMode ? onSelectToggle : undefined}
      className={`group relative flex items-start gap-3 p-3 rounded-lg transition-all text-left break-inside-avoid ${
        draggable ? "cursor-grab active:cursor-grabbing" : selectMode ? "cursor-pointer" : ""
      } ${
        isDropTarget ? "ring-2 ring-sidebar/40 " : ""
      }${
        selectMode && isSelected
          ? "bg-sky/10 border border-sky ring-1 ring-sky/40"
          : task.done
            ? "bg-emerald-50/50 border border-emerald-200"
            : "bg-cream/30 border border-card-border hover:border-sand"
      }`}
    >
      {/* Print-only done marker — the styled checkbox relies on background
          colors that don't print. */}
      <span className="hidden print:inline-block shrink-0 mt-0.5 text-base leading-5 font-bold text-charcoal">
        {task.done ? "✓" : "☐"}
      </span>
      <button
        onClick={(e) => {
          if (selectMode) {
            e.stopPropagation();
            onSelectToggle?.();
            return;
          }
          onToggle();
        }}
        className={`print:hidden w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          selectMode
            ? isSelected
              ? "bg-sky border-sky"
              : "border-sky/50 hover:border-sky"
            : task.done
              ? "bg-emerald-500 border-emerald-500"
              : "border-card-border hover:border-sand"
        }`}
      >
        {(selectMode ? isSelected : task.done) && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              if (selectMode) {
                e.stopPropagation();
                onSelectToggle?.();
                return;
              }
              onEdit?.();
            }}
            disabled={!selectMode && !onEdit}
            className={`text-sm font-medium text-left ${
              task.done ? "text-warm-gray line-through" : "text-charcoal"
            } ${!selectMode && onEdit ? "hover:underline cursor-pointer" : "cursor-default"}`}
            title={selectMode ? undefined : onEdit ? "Click to edit" : undefined}
          >
            {task.task}
          </button>
          {taskTags(task).map((tag) => {
            const meta = categoryMeta[tag];
            if (!meta) return null;
            return (
              <span
                key={tag}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta.color} ${meta.bg}`}
              >
                {meta.label}
              </span>
            );
          })}
          {task.sticky && (
            <span
              title="Stays on the list every day until checked off"
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200"
            >
              Until done
            </span>
          )}
          {task.outcome === "partial" && (
            <span
              title={task.outcomeNote || "Started but not finished"}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200"
            >
              Partial
            </span>
          )}
          {task.outcome === "refused" && (
            <span
              title={task.outcomeNote || "Offered but refused"}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200"
            >
              Refused
            </span>
          )}
          {task.outcome === "issue" && (
            <span
              title={task.outcomeNote || "Issue noted"}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200"
            >
              Issue
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-warm-gray bg-cream border border-card-border">
              <Clock className="w-2.5 h-2.5" />
              {task.estimatedMinutes}m
            </span>
          )}
          {source.badge && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-sky-dark bg-sky/10 border border-sky/20">
              <Zap className="w-2.5 h-2.5" />
              {source.label}
            </span>
          )}
          {task.templateId && (
            <span
              title="Repeats automatically — edit the task to stop it"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200"
            >
              <Repeat className="w-2.5 h-2.5" />
              Repeats
            </span>
          )}
        </div>
        {!hideAnimal && task.animalSpecific && (
          <p className="text-[11px] text-sky-dark font-medium mt-0.5">
            {task.animalSpecific}
          </p>
        )}
        {task.note && (
          <div className="mt-0.5 print:hidden">
            <ExpandableText
              text={task.note}
              className="text-[11px] text-warm-gray italic"
              clampChars={180}
            />
          </div>
        )}
        {/* Print keeps the full note (no Read more on paper). */}
        {task.note && (
          <p className="hidden print:block text-[11px] text-warm-gray mt-0.5 italic whitespace-pre-line">
            {normalizeParagraphs(task.note)}
          </p>
        )}
        {task.outcomeNote && (
          <p className="text-[11px] text-amber-800 mt-0.5">
            {task.outcomeNote}
          </p>
        )}
        {/* Print-only assignee names (the colored chips don't print) */}
        {getAssignees(task).length > 0 && (
          <p className="hidden print:block text-[11px] text-charcoal mt-0.5">
            Assigned: {getAssignees(task).join(", ")}
          </p>
        )}
        {/* Assign chips + outcome flag */}
        <div className="flex items-center gap-2 flex-wrap">
          <AssignChips task={task} onAssign={onAssign} />
          {onOutcome && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOutcomeDraft(
                  task.outcome === "refused" || task.outcome === "issue"
                    ? task.outcome
                    : "partial"
                );
                setOutcomeNoteDraft(task.outcomeNote ?? "");
                setOutcomeOpen((v) => !v);
              }}
              className={`print:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors mt-1.5 ${
                task.outcome
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-warm-gray/60 bg-white border-card-border hover:text-charcoal hover:bg-cream"
              }`}
              title="Didn't finish or refused? Record it for the history."
            >
              <Info className="w-3 h-3" />
              {task.outcome ? "Edit outcome" : "Issue?"}
            </button>
          )}
        </div>
        {outcomeOpen && onOutcome && (
          <div className="mt-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2 print:hidden">
            <div className="flex gap-1.5">
              {(
                [
                  ["partial", "Partial"],
                  ["refused", "Refused"],
                  ["issue", "Medical / other issue"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setOutcomeDraft(value)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold border transition-colors ${
                    outcomeDraft === value
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-charcoal border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={outcomeNoteDraft}
              onChange={(e) => setOutcomeNoteDraft(e.target.value)}
              placeholder="e.g. only ate half, spit out meds, limping"
              className="w-full px-2 py-1.5 text-xs border border-amber-200 rounded-md text-charcoal focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            {task.animalSpecific && (
              <p className="text-[10px] text-amber-800/80">
                Saved to history and to {task.animalSpecific}&apos;s profile.
              </p>
            )}
            <div className="flex justify-between items-center">
              {task.outcome ? (
                <button
                  onClick={() => {
                    onOutcome("", "");
                    setOutcomeOpen(false);
                  }}
                  className="text-[11px] font-medium text-warm-gray hover:text-charcoal"
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOutcomeOpen(false)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white border border-amber-200 rounded-md text-charcoal hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onOutcome(outcomeDraft, outcomeNoteDraft.trim());
                    setOutcomeOpen(false);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter Pill Component ──

function FilterPill({
  label,
  active,
  onClick,
  dotColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-sidebar text-white border-sidebar"
          : "bg-white text-charcoal border-card-border hover:bg-cream"
      }`}
    >
      {dotColor && !active && (
        <span
          className={`w-2 h-2 rounded-full ${dotColor.replace("text-", "bg-")}`}
        />
      )}
      {label}
    </button>
  );
}

// ── Upcoming Tasks Card ──
// Shows tasks scheduled for a future date (tomorrow and on). Separate from
// the Daily Routine columns (which are strictly today), so future-dated
// tasks aren't hidden until their date rolls around.

interface UpcomingApiTask {
  id: string;
  task: string;
  block: string;
  category: string;
  date: string;
  assignedTo: string | null;
  animalSpecific: string | null;
  done: boolean;
}

function UpcomingTasksCard() {
  const [rows, setRows] = useState<UpcomingApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        const from = today.toISOString().split("T")[0];
        const until = new Date();
        until.setDate(until.getDate() + 30);
        const to = until.toISOString().split("T")[0];
        const res = await fetch(
          `/api/tasks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const body = (await res.json()) as { tasks: UpcomingApiTask[] };
        if (!cancelled) {
          setRows(body.tasks);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || rows.length === 0) return null;

  const grouped = rows.reduce<Record<string, UpcomingApiTask[]>>((acc, r) => {
    (acc[r.date] ||= []).push(r);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();
  const visibleDates = expanded ? sortedDates : sortedDates.slice(0, 3);

  // Weekday + MM-DD-YYYY (no year suffix), e.g. "Monday, 04-28-2026".
  const formatLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${weekday}, ${mm}-${dd}-${yyyy}`;
  };

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-charcoal flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky" />
          Upcoming Tasks
          <span className="text-[11px] font-semibold text-warm-gray bg-cream px-2 py-0.5 rounded-full">
            {rows.length}
          </span>
        </h3>
        {sortedDates.length > 3 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-sidebar hover:text-sidebar-light"
          >
            {expanded ? "Show less" : `Show all (${sortedDates.length} days)`}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {visibleDates.map((date) => (
          <div key={date}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/70 mb-1.5">
              {formatLabel(date)}
            </p>
            <ul className="space-y-1.5">
              {grouped[date].map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-cream/40 border border-card-border"
                >
                  <span className="text-[10px] font-semibold text-warm-gray/70 uppercase shrink-0 mt-0.5">
                    {t.block}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal">{t.task}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.animalSpecific && (
                        <span className="text-[10px] font-medium text-sky-dark">
                          {t.animalSpecific}
                        </span>
                      )}
                      {t.assignedTo && (
                        <span className="text-[10px] font-medium text-emerald-700">
                          → {t.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
