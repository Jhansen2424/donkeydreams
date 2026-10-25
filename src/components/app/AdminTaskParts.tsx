"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  CalendarClock,
  Repeat as RepeatIcon,
  Pencil,
  Trash2,
  Loader2,
  ClipboardCheck,
  Plus,
  Printer,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { localToday } from "@/lib/schedule-context";
import ExpandableText from "@/components/app/ExpandableText";
import { formatDate } from "@/lib/format-date";
import {
  REPEAT_LABEL,
  REPEAT_OPTIONS,
  dueStatus,
  sortAdminTasks,
  type useAdminTasks,
  type AdminTask,
  type AdminTaskInput,
  type Repeat,
} from "@/lib/admin-tasks";

const REPEAT_UNIT: Record<Repeat, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

const chip ="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-semibold";

/** Due date, repeat, and "Until done" (only for tasks with neither). */
export function AdminTaskChips({ task, today }: { task: AdminTask; today: string }) {
  const status = dueStatus(task.dueDate, today);
  const dueTone = task.done
    ? "text-warm-gray/60 bg-cream/60 border-card-border"
    : status === "overdue" || status === "today"
      ? "text-red-700 bg-red-50 border-red-200"
      : status === "soon"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-purple-700 bg-purple-50 border-purple-200";
  const dueLabel = task.done
    ? "Was due"
    : status === "overdue"
      ? "Overdue"
      : status === "today"
        ? "Due today"
        : "Due";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {task.dueDate && (
        <span className={`${chip} ${dueTone}`}>
          <CalendarClock className="w-3 h-3" />
          {dueLabel} {formatDate(task.dueDate)}
        </span>
      )}
      {task.repeat && (
        <span className={`${chip} text-sky-800 bg-sky-50 border-sky-200`}>
          <RepeatIcon className="w-3 h-3" />
          {REPEAT_LABEL[task.repeat]}
        </span>
      )}
      {!task.dueDate && !task.repeat && !task.done && (
        <span className={`${chip} text-indigo-700 bg-indigo-50 border-indigo-200`}>Until done</span>
      )}
      {task.done && task.completedAt && (
        <span className="text-[11px] text-emerald-700">
          Done {formatDate(new Date(task.completedAt))}
        </span>
      )}
    </span>
  );
}

/** Add or edit an admin task. */
export function AdminTaskForm({
  initial,
  today,
  saveLabel,
  onSave,
  onCancel,
}: {
  initial?: AdminTask;
  today: string;
  saveLabel: string;
  onSave: (input: AdminTaskInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [task, setTask] = useState(initial?.task ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [repeat, setRepeat] = useState<Repeat | "">(initial?.repeat ?? "");
  const [saving, setSaving] = useState(false);

  const field =
    "w-full px-3 py-2 text-sm bg-white border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50";
  const label = "text-[11px] font-semibold uppercase tracking-wider text-warm-gray/70";

  async function save() {
    if (!task.trim() || saving) return;
    setSaving(true);
    const ok = await onSave({ task, note, assignedTo, dueDate, repeat });
    setSaving(false);
    if (ok && !initial) {
      setTask("");
      setNote("");
      setAssignedTo("");
      setDueDate("");
      setRepeat("");
    }
  }

  return (
    <div className="space-y-3 p-3 bg-cream/40 rounded-lg border border-card-border">
      <input
        autoFocus
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          }
        }}
        placeholder="e.g. Submit quarterly grant report"
        className={field}
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notes or details (optional)"
        rows={3}
        className={field}
      />
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className={label}>Due date</span>
          <input
            type="date"
            value={dueDate}
            min={initial ? undefined : today}
            onChange={(e) => setDueDate(e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="block">
          <span className={label}>Repeats</span>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as Repeat | "")}
            className={`${field} mt-1`}
          >
            {REPEAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Who (optional)</span>
          <input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="e.g. Amber"
            className={`${field} mt-1`}
          />
        </label>
      </div>
      {repeat && (
        <p className="text-xs text-warm-gray">
          When you check it off, the next one is added automatically
          {dueDate ? `, due one ${REPEAT_UNIT[repeat]} later.` : "."}
          {!dueDate && " Add a due date so each one shows when it's due."}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!task.trim() || saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

/** One admin task: checkbox, title, chips, notes, and (optionally) edit/delete. */
export function AdminTaskRow({
  task,
  today,
  compact = false,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: AdminTask;
  today: string;
  compact?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <li
      className={`flex items-start gap-3 p-2.5 rounded-lg border group ${
        task.done ? "bg-cream/40 border-card-border opacity-70" : "bg-white border-card-border"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        title={task.done ? "Mark not done" : "Mark done"}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.done ? "bg-emerald-500 border-emerald-500" : "bg-white border-warm-gray/30 hover:border-emerald-400"
        }`}
      >
        {task.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${task.done ? "line-through text-warm-gray/60" : "text-charcoal"} ${
            compact ? "truncate" : ""
          }`}
        >
          {task.task}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <AdminTaskChips task={task} today={today} />
          {task.assignedTo && <span className="text-[11px] text-emerald-700">{task.assignedTo}</span>}
        </div>
        {!compact && task.note && (
          <div className="mt-1">
            <ExpandableText text={task.note} className="text-xs text-warm-gray" clampChars={200} />
          </div>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit task"
              className="p-1.5 text-warm-gray/60 hover:text-sidebar rounded-md hover:bg-cream"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete task"
              className="p-1.5 text-warm-gray/50 hover:text-red-500 rounded-md hover:bg-cream"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </li>
  );
}

// ── Admin Tasks preview ──
// The dashboard shows only what's next (client 10/24: the full list pushed
// everything else down). The full list, editing and printing live on
// /app/admin/tasks.

const PREVIEW_COUNT = 5;

export function AdminTasksPreview({ adminTasks }: { adminTasks: ReturnType<typeof useAdminTasks> }) {
  const { tasks, loading, toggle } = adminTasks;
  const { toastSuccess, toastError } = useToast();
  const today = localToday();
  const open = sortAdminTasks(tasks).filter((t) => !t.done);
  const overdue = open.filter((t) => dueStatus(t.dueDate, today) === "overdue").length;
  const thisWeek = open.filter((t) => {
    const s = dueStatus(t.dueDate, today);
    return s === "today" || s === "soon";
  }).length;

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-bold text-charcoal flex items-center gap-2 min-w-0 whitespace-nowrap">
          <ClipboardCheck className="w-4 h-4 text-purple-600 shrink-0" />
          Admin Tasks
          <span className="text-xs font-medium text-warm-gray">{open.length} open</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <Link
            href="/app/admin/tasks?print=1"
            title="Print or save the admin task list as a PDF"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-charcoal border border-card-border rounded-md hover:bg-cream transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Link>
          <Link
            href="/app/admin/tasks?add=1"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sidebar border border-card-border rounded-md hover:bg-sidebar hover:text-white hover:border-sidebar transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Link>
        </div>
      </div>
      {(overdue > 0 || thisWeek > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {overdue > 0 && (
            <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5">
              {overdue} overdue
            </span>
          )}
          {thisWeek > 0 && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              {thisWeek} due this week
            </span>
          )}
        </div>
      )}
      {loading && tasks.length === 0 ? (
        <p className="text-sm text-warm-gray/60 py-4 text-center">Loading…</p>
      ) : open.length === 0 ? (
        <p className="text-sm text-warm-gray/60 py-4 text-center">
          No open admin tasks. Add standing items like grant deadlines here.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {open.slice(0, PREVIEW_COUNT).map((t) => (
            <AdminTaskRow
              key={t.id}
              task={t}
              today={today}
              compact
              onToggle={async () => {
                const ok = await toggle(t.id);
                if (!ok) toastError("Couldn't update the task. Try again.");
                else if (t.repeat) toastSuccess("Done. The next one has been added.");
              }}
            />
          ))}
        </ul>
      )}
      <Link
        href="/app/admin/tasks"
        className="mt-3 flex items-center justify-center gap-1 w-full px-3 py-2 text-sm font-medium text-sidebar bg-cream/50 border border-card-border rounded-lg hover:bg-cream"
      >
        {open.length > PREVIEW_COUNT ? `See all ${open.length} admin tasks` : "Open admin tasks"}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
