"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Check, Loader2 } from "lucide-react";
import { animals } from "@/lib/animals";
import { volunteers } from "@/lib/volunteer-data";
import { categoryMeta, type TaskCategory, type ScheduleTask } from "@/lib/sanctuary-data";
import { useSchedule } from "@/lib/schedule-context";

const BLOCKS: Array<"AM" | "Mid" | "PM"> = ["AM", "Mid", "PM"];
const CATEGORIES: TaskCategory[] = [
  "routine",
  "feeding",
  "treatment",
  "special-needs",
  "hoof-dental",
  "weight",
  "sponsor",
  "projects",
  "admin",
  "care",
  "ranch",
];

const activeMembers = volunteers.filter((v) => v.status === "active");
const sortedAnimals = [...animals].sort((a, b) => a.name.localeCompare(b.name));

export type TaskEditModalMode =
  | { kind: "add"; defaultBlock?: string }
  | { kind: "edit"; blockIdx: number; taskIdx: number; task: ScheduleTask; defaultBlock: string };

interface Props {
  open: boolean;
  onClose: () => void;
  mode: TaskEditModalMode;
}

function splitAssignees(s?: string): string[] {
  return s ? s.split(", ").filter(Boolean) : [];
}

export default function TaskEditModal({ open, onClose, mode }: Props) {
  const { addTask, editTask, deleteTask } = useSchedule();

  // Form state
  const [text, setText] = useState("");
  const [block, setBlock] = useState<string>("AM");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [animal, setAnimal] = useState("");
  const [category, setCategory] = useState<TaskCategory>("routine");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset form whenever the modal opens or mode changes
  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setSaving(false);
    const todayIso = new Date().toISOString().split("T")[0];
    if (mode.kind === "add") {
      setText("");
      setBlock(mode.defaultBlock ?? "AM");
      setAssignees([]);
      setAnimal("");
      setCategory("routine");
      setDate(todayIso);
    } else {
      setText(mode.task.task);
      setAssignees(splitAssignees(mode.task.assignedTo));
      setAnimal(mode.task.animalSpecific ?? "");
      setCategory(mode.task.category);
      // Find the block name — the caller already has block context, but we
      // need to infer from the defaultBlock passed alongside `blockIdx`. We
      // accept the caller wrapping this component; for edit mode we read the
      // block from the schedule indirectly, so expose a `block` field too.
      // Simpler: pass block via a side channel — see TaskEditModalEdit below.
      setBlock(mode.defaultBlock ?? "AM");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  if (!open) return null;

  const toggleAssignee = (name: string) => {
    setAssignees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const assignedTo = assignees.join(", ") || undefined;
      if (mode.kind === "add") {
        await addTask({
          task: text.trim(),
          blockName: block,
          assignedTo,
          animalSpecific: animal || undefined,
          category,
          date,
        });
      } else {
        await editTask(mode.blockIdx, mode.taskIdx, {
          task: text.trim(),
          assignedTo: assignedTo ?? "",
          animalSpecific: animal,
          blockName: block,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode.kind !== "edit") return;
    setSaving(true);
    try {
      await deleteTask(mode.blockIdx, mode.taskIdx);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const title = mode.kind === "add" ? "Add task" : "Edit task";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-white text-lg">{title}</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Task text */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Task
            </label>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Trim Blossom's hooves"
              rows={2}
              className="w-full px-3 py-2 text-base border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 resize-none"
            />
          </div>

          {/* Date (add mode only — edit keeps its original date) */}
          {mode.kind === "add" && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
              <p className="text-[11px] text-warm-gray/70 mt-1">
                Schedule for today or a future date. Today&apos;s routine only
                shows today&apos;s tasks.
              </p>
            </div>
          )}

          {/* Time block */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Time block
            </label>
            <div className="flex gap-1.5">
              {BLOCKS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBlock(b)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    block === b ? "bg-sky text-white" : "bg-cream text-charcoal hover:bg-sand/30"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Assigned to
            </label>
            <div className="flex flex-wrap gap-2">
              {activeMembers.map((m) => {
                const selected = assignees.includes(m.name);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleAssignee(m.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-white text-warm-gray border-card-border hover:bg-cream"
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {m.name}
                  </button>
                );
              })}
            </div>
            {activeMembers.length === 0 && (
              <p className="text-xs text-warm-gray italic">No active team members.</p>
            )}
          </div>

          {/* Animal */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Animal (optional)
            </label>
            <input
              list="modal-animal-list"
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              placeholder="Start typing..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
            <datalist id="modal-animal-list">
              {sortedAnimals.map((a) => (
                <option key={a.slug} value={a.name} />
              ))}
            </datalist>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryMeta[c].label}
                </option>
              ))}
            </select>
          </div>

          {/* Delete (edit mode only) */}
          {mode.kind === "edit" && (
            <div className="pt-3 border-t border-card-border">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete task
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="text-sm text-red-700 flex-1">Delete this task?</span>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-white border border-card-border text-charcoal text-sm rounded-lg hover:bg-cream"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-card-border flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!text.trim() || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {mode.kind === "add" ? "Add task" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
