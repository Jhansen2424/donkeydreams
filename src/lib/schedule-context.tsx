"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  generateDailySchedule,
  type ScheduleBlock,
  type ScheduleTask,
  type TaskCategory,
  type TaskSource,
} from "./sanctuary-data";

export interface NewTaskInput {
  task: string;
  blockName?: string; // "AM" | "Mid" | "PM" — defaults to current time block
  assignedTo?: string;
  animalSpecific?: string;
  note?: string;
  category?: TaskCategory;
  /** Multi-tag taxonomy. Overrides `category` when provided. */
  tags?: TaskCategory[];
  /** ISO date (YYYY-MM-DD). Defaults to today. Used for scheduling tasks ahead. */
  date?: string;
  /**
   * When set, creates a RECURRING routine template instead of a one-day
   * task: [] = every day, otherwise JS weekday numbers (0=Sun … 6=Sat).
   * The template materializes into each matching day automatically.
   */
  repeatDays?: number[];
  /** "Until done": the task stays on every day's list until checked off. */
  sticky?: boolean;
}

export interface EditTaskInput {
  task?: string;
  assignedTo?: string;
  animalSpecific?: string;
  note?: string;
  blockName?: string;
  tags?: TaskCategory[];
  /** Repeating tasks only (applies to the template with applyToSeries):
      [] = every day, else JS weekday numbers. */
  repeatDays?: number[];
}

interface ScheduleContextValue {
  schedule: ScheduleBlock[];
  toggleTask: (blockIdx: number, taskIdx: number) => Promise<void>;
  assignTask: (blockIdx: number, taskIdx: number, memberName: string) => Promise<void>;
  bulkAssign: (blockIdx: number, memberName: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  editTask: (
    blockIdx: number,
    taskIdx: number,
    updates: EditTaskInput,
    opts?: {
      /** For repeating tasks: also write the changes to the template so
          every future day inherits them (the default in the edit modal). */
      applyToSeries?: boolean;
    }
  ) => Promise<void>;
  deleteTask: (
    blockIdx: number,
    taskIdx: number,
    opts?: { entireSeries?: boolean }
  ) => Promise<void>;
  reorderTask: (blockIdx: number, fromIdx: number, toIdx: number) => Promise<void>;
  /** Copy a task (name + " (copy)") into the same block, at the end. A
      repeating original produces a repeating copy on the same days. */
  duplicateTask: (blockIdx: number, taskIdx: number) => Promise<void>;
  /** Multi-select actions — addressed by server id so the list can shift
      underneath without the wrong rows being hit. */
  bulkComplete: (ids: string[]) => Promise<void>;
  bulkMove: (ids: string[], blockName: string) => Promise<void>;
  bulkAssignTo: (ids: string[], memberName: string) => Promise<void>;
  /** Removes the selected tasks from THIS day only (repeating tasks skip
      the date and come back on their next scheduled day). */
  bulkDelete: (ids: string[]) => Promise<void>;
  /** Record how a task went: "" normal, "partial", "refused" (+ why). */
  setOutcome: (
    blockIdx: number,
    taskIdx: number,
    outcome: "" | "partial" | "refused" | "issue",
    outcomeNote: string
  ) => Promise<void>;
  /** Deactivate a recurring template — future days stop getting the task. */
  stopRepeating: (templateId: string) => Promise<void>;
  resetSchedule: () => Promise<void>;
  refresh: (date?: string) => Promise<void>;
  /** The ISO date (YYYY-MM-DD) the schedule currently shows. */
  currentDate: string;
  loading: boolean;
  error: string | null;
}

function currentBlockName(): "AM" | "Mid" | "PM" {
  const hour = new Date().getHours();
  if (hour < 10) return "AM";
  if (hour < 16) return "Mid";
  return "PM";
}

// Today's date in the USER'S timezone, as YYYY-MM-DD. The server runs in UTC,
// so `new Date().toISOString()` flips to tomorrow at ~5–6 PM local — which is
// how evening-entered tasks ended up stamped (and filtered) a day ahead.
// en-CA formats as YYYY-MM-DD in local time.
export function localToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

// Legacy block names used to live on persisted tasks. Map old → new so
// historical rows still route to the correct column.
function normalizeBlockName(name: string | undefined): string {
  switch (name) {
    case "Breakfast":
      return "AM";
    case "Lunch":
      return "Mid";
    case "Dinner":
      return "PM";
    default:
      return name || "AM";
  }
}

// ── ScheduleTask with the server-side id ──
// `serverId` now lives on ScheduleTask itself (components use it for stable
// keys and to resolve which row to mutate). Alias kept for readability.
type TaskWithId = ScheduleTask & { serverId?: string };

interface ApiTask {
  id: string;
  task: string;
  block: string;
  category: string;
  tags?: string[];
  date: string;
  assignedTo: string | null;
  done: boolean;
  note: string | null;
  animalSpecific: string | null;
  templateId: string | null;
  sticky?: boolean;
  outcome?: string;
  outcomeNote?: string;
  sortOrder?: number;
  createdAt: string;
}

function apiToTask(a: ApiTask): TaskWithId {
  const tags = (a.tags && a.tags.length > 0 ? a.tags : a.category ? [a.category] : ["routine"]) as TaskCategory[];
  return {
    task: a.task,
    assignedTo: a.assignedTo || undefined,
    done: a.done,
    animalSpecific: a.animalSpecific || undefined,
    note: a.note || undefined,
    category: tags[0] ?? "routine",
    tags,
    source: (a.templateId ? "base" : "manual") as TaskSource,
    sticky: a.sticky === true,
    outcome: a.outcome || "",
    outcomeNote: a.outcomeNote || "",
    sortOrder: a.sortOrder,
    serverId: a.id,
    templateId: a.templateId,
  };
}

// Merge a flat list of tasks into the empty 3-block skeleton from
// generateDailySchedule(). Any task whose block doesn't match a known block
// goes into the first block as a fallback.
function mergeTasksIntoSchedule(tasks: TaskWithId[], blockOf: (t: TaskWithId) => string): ScheduleBlock[] {
  const skeleton: ScheduleBlock[] = generateDailySchedule().map((b) => ({ ...b, tasks: [] }));
  const byName = new Map(skeleton.map((b) => [b.name, b]));
  for (const t of tasks) {
    const name = blockOf(t);
    const target = byName.get(name) ?? skeleton[0];
    target.tasks.push(t);
  }
  return skeleton;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(() =>
    generateDailySchedule().map((b) => ({ ...b, tasks: [] as ScheduleTask[] }))
  );
  const [taskBlocks, setTaskBlocks] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The date the schedule is showing. Defaults to LOCAL today (the server's
  // UTC "today" can be a day ahead in the evening). Kept in a ref too so the
  // mutation callbacks below can read it without re-creating themselves.
  const [currentDate, setCurrentDate] = useState<string>(() => localToday());
  const currentDateRef = useRef(currentDate);

  const refresh = useCallback(async (date?: string) => {
    setError(null);
    const target = date ?? currentDateRef.current;
    if (target !== currentDateRef.current) {
      currentDateRef.current = target;
      setCurrentDate(target);
    }
    try {
      const res = await fetch(`/api/tasks?date=${encodeURIComponent(target)}`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const body = (await res.json()) as { tasks: ApiTask[] };
      const tasks = body.tasks.map(apiToTask);
      const blockMap = new Map(body.tasks.map((a) => [a.id, a.block]));
      setTaskBlocks(blockMap);
      setSchedule(mergeTasksIntoSchedule(tasks, (t) => normalizeBlockName(t.serverId ? blockMap.get(t.serverId) : undefined)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Resolve a (blockIdx, taskIdx) into the current server id + block name.
  const resolveIds = (blockIdx: number, taskIdx: number) => {
    const block = schedule[blockIdx];
    const task = block?.tasks[taskIdx] as TaskWithId | undefined;
    if (!block || !task || !task.serverId) return null;
    return { serverId: task.serverId, blockName: block.name };
  };

  // Apply a transform to local state, then roll it back on API failure.
  const localUpdate = (
    transform: (prev: ScheduleBlock[]) => ScheduleBlock[]
  ): ScheduleBlock[] => {
    let snapshot: ScheduleBlock[] = schedule;
    setSchedule((prev) => {
      snapshot = prev;
      return transform(prev);
    });
    return snapshot;
  };

  // ── Mutations ──
  const toggleTask = useCallback(async (blockIdx: number, taskIdx: number) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;
    const current = schedule[blockIdx].tasks[taskIdx];
    const nextDone = !current.done;

    const snapshot = localUpdate((prev) =>
      prev.map((block, bi) =>
        bi === blockIdx
          ? { ...block, tasks: block.tasks.map((t, ti) => (ti === taskIdx ? { ...t, done: nextDone } : t)) }
          : block
      )
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ids.serverId, done: nextDone }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  }, [schedule]);

  const assignTask = useCallback(async (blockIdx: number, taskIdx: number, memberName: string) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;
    const current = schedule[blockIdx].tasks[taskIdx];
    const list = current.assignedTo ? current.assignedTo.split(", ").filter(Boolean) : [];
    const nextList = list.includes(memberName) ? list.filter((n) => n !== memberName) : [...list, memberName];
    const nextAssignedTo = nextList.join(", ") || undefined;

    const snapshot = localUpdate((prev) =>
      prev.map((block, bi) =>
        bi === blockIdx
          ? { ...block, tasks: block.tasks.map((t, ti) => (ti === taskIdx ? { ...t, assignedTo: nextAssignedTo } : t)) }
          : block
      )
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ids.serverId, assignedTo: nextAssignedTo ?? null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to assign");
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to assign task");
    }
  }, [schedule]);

  const bulkAssign = useCallback(async (blockIdx: number, memberName: string) => {
    const block = schedule[blockIdx];
    if (!block) return;
    // Add memberName to any task in this block that doesn't already include them.
    const patches: Array<{ id: string; assignedTo: string }> = [];
    const snapshot = localUpdate((prev) =>
      prev.map((b, bi) => {
        if (bi !== blockIdx) return b;
        return {
          ...b,
          tasks: b.tasks.map((t) => {
            const tid = (t as TaskWithId).serverId;
            const list = t.assignedTo ? t.assignedTo.split(", ").filter(Boolean) : [];
            if (list.includes(memberName)) return t;
            const next = [...list, memberName].join(", ");
            if (tid) patches.push({ id: tid, assignedTo: next });
            return { ...t, assignedTo: next } as TaskWithId;
          }),
        };
      })
    );

    try {
      await Promise.all(patches.map((p) =>
        fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        }).then((r) => { if (!r.ok) throw new Error("patch failed"); })
      ));
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to bulk assign");
    }
  }, [schedule]);

  const addTask = useCallback(async (input: NewTaskInput) => {
    const block = input.blockName ?? currentBlockName();
    // Default to the VIEWED date (local today unless the user navigated),
    // so adding while looking at tomorrow creates tomorrow's task.
    const viewedDate = currentDateRef.current;
    const taskDate = input.date || viewedDate;
    // Append to the END of the target block: one past the block's highest
    // sortOrder. (Using the task COUNT broke after the 9/15 order restore,
    // whose sortOrders don't start at 0 — new tasks landed mid-list.)
    const blockTasks = schedule.find((b) => b.name === block)?.tasks ?? [];
    const sortOrder =
      blockTasks.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1) + 1;

    // Recurring: create a template; the server materializes it into each
    // matching day on load, so a refresh brings in the viewed day's instance.
    if (input.repeatDays !== undefined) {
      try {
        const res = await fetch("/api/tasks/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: input.task,
            block,
            category: input.category ?? "routine",
            tags: input.tags ?? (input.category ? [input.category] : undefined),
            assignedTo: input.assignedTo,
            animalSpecific: input.animalSpecific,
            note: input.note,
            repeatDays: input.repeatDays,
            sortOrder,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to add");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add recurring task");
      }
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: input.task,
          block,
          category: input.category ?? "routine",
          tags: input.tags ?? (input.category ? [input.category] : undefined),
          assignedTo: input.assignedTo,
          animalSpecific: input.animalSpecific,
          note: input.note,
          date: taskDate,
          sortOrder,
          sticky: input.sticky === true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to add");
      const body = (await res.json()) as { task: ApiTask };
      const newTask = apiToTask(body.task);
      setTaskBlocks((prev) => {
        const next = new Map(prev);
        next.set(body.task.id, body.task.block);
        return next;
      });
      // Only splice into the schedule view when the task is for the date the
      // view is showing. Other dates surface when the user views that date.
      if (taskDate === viewedDate) {
        setSchedule((prev) =>
          prev.map((b) => (b.name === body.task.block ? { ...b, tasks: [...b.tasks, newTask] } : b))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task");
    }
  }, [schedule, refresh]);

  const editTask = useCallback(async (
    blockIdx: number,
    taskIdx: number,
    updates: EditTaskInput,
    opts?: { applyToSeries?: boolean }
  ) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;
    const templateId = (schedule[blockIdx]?.tasks[taskIdx] as TaskWithId | undefined)?.templateId;
    const moving = updates.blockName && updates.blockName !== ids.blockName;

    // Optimistic patch locally
    const snapshot = localUpdate((prev) => {
      const target = prev[blockIdx]?.tasks[taskIdx];
      if (!target) return prev;
      const patched: TaskWithId = {
        ...target,
        task: updates.task ?? target.task,
        assignedTo: updates.assignedTo !== undefined ? updates.assignedTo || undefined : target.assignedTo,
        animalSpecific: updates.animalSpecific !== undefined ? updates.animalSpecific || undefined : target.animalSpecific,
        note: updates.note !== undefined ? updates.note || undefined : target.note,
        tags: updates.tags ?? target.tags,
        category: updates.tags ? (updates.tags[0] ?? "routine") : target.category,
      };
      if (!moving) {
        return prev.map((b, bi) =>
          bi === blockIdx ? { ...b, tasks: b.tasks.map((t, ti) => (ti === taskIdx ? patched : t)) } : b
        );
      }
      return prev.map((b, bi) => {
        if (bi === blockIdx) return { ...b, tasks: b.tasks.filter((_, ti) => ti !== taskIdx) };
        if (b.name === updates.blockName) return { ...b, tasks: [...b.tasks, patched] };
        return b;
      });
    });

    try {
      const patchBody: Record<string, unknown> = { id: ids.serverId };
      if (updates.task !== undefined) patchBody.task = updates.task;
      if (updates.assignedTo !== undefined) patchBody.assignedTo = updates.assignedTo || null;
      if (updates.animalSpecific !== undefined) patchBody.animalSpecific = updates.animalSpecific || null;
      if (updates.note !== undefined) patchBody.note = updates.note || null;
      if (updates.tags !== undefined) patchBody.tags = updates.tags;
      if (moving) patchBody.block = updates.blockName;

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to edit");

      // Repeating task + "apply to every day": write the same changes to the
      // template so tomorrow's materialized copy carries them too. (Without
      // this, notes edited on one day silently reverted the next morning.)
      if (opts?.applyToSeries && templateId) {
        const templatePatch: Record<string, unknown> = { id: templateId };
        if (updates.task !== undefined) templatePatch.task = updates.task;
        if (updates.note !== undefined) templatePatch.note = updates.note || null;
        if (updates.assignedTo !== undefined) templatePatch.assignedTo = updates.assignedTo || null;
        if (updates.animalSpecific !== undefined) templatePatch.animalSpecific = updates.animalSpecific || null;
        if (updates.tags !== undefined) templatePatch.tags = updates.tags;
        if (updates.repeatDays !== undefined) templatePatch.repeatDays = updates.repeatDays;
        if (moving && updates.blockName) templatePatch.block = updates.blockName;
        if (Object.keys(templatePatch).length > 1) {
          await fetch("/api/tasks/templates", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templatePatch),
          }).catch(() => {});
        }
      }

      if (moving && updates.blockName) {
        setTaskBlocks((prev) => {
          const next = new Map(prev);
          next.set(ids.serverId, updates.blockName!);
          return next;
        });
      }
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to edit task");
    }
  }, [schedule]);

  const deleteTask = useCallback(async (
    blockIdx: number,
    taskIdx: number,
    opts?: {
      /** For repeating tasks: also deactivate the template so the task stops
          coming back on future days. Without it, deleting a repeating task
          only removes THAT day's copy — it rematerializes tomorrow (the
          "deleted task came back a day later" surprise). */
      entireSeries?: boolean;
    }
  ) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;
    const templateId = (schedule[blockIdx]?.tasks[taskIdx] as TaskWithId | undefined)?.templateId;

    const snapshot = localUpdate((prev) =>
      prev.map((b, bi) =>
        bi === blockIdx ? { ...b, tasks: b.tasks.filter((_, ti) => ti !== taskIdx) } : b
      )
    );

    try {
      // Deactivate the template FIRST so a concurrent materialization can't
      // recreate the instance between the delete and the deactivate.
      if (opts?.entireSeries && templateId) {
        await fetch("/api/tasks/templates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: templateId, active: false }),
        }).catch(() => {});
      }
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(ids.serverId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      setTaskBlocks((prev) => {
        const next = new Map(prev);
        next.delete(ids.serverId);
        return next;
      });
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }, [schedule]);

  // Move a task within its block, then persist the block's new order as
  // sortOrder = index via one bulk-reorder PATCH.
  const reorderTask = useCallback(async (blockIdx: number, fromIdx: number, toIdx: number) => {
    const block = schedule[blockIdx];
    if (!block || fromIdx === toIdx) return;
    if (!block.tasks[fromIdx] || toIdx < 0 || toIdx >= block.tasks.length) return;

    const moved = [...block.tasks];
    const [task] = moved.splice(fromIdx, 1);
    moved.splice(toIdx, 0, task);

    const snapshot = localUpdate((prev) =>
      prev.map((b, bi) => (bi === blockIdx ? { ...b, tasks: moved } : b))
    );

    const reorder = moved
      .map((t, i) => ({ id: (t as TaskWithId).serverId, sortOrder: i }))
      .filter((r): r is { id: string; sortOrder: number } => Boolean(r.id));

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to reorder");

      // Write the new order through to the recurring templates too —
      // otherwise tomorrow's materialized copies snap back to the old order
      // (client: "the AM tasks were out of the order I organized them in").
      for (const [i, t] of moved.entries()) {
        const templateId = (t as TaskWithId).templateId;
        if (!templateId) continue;
        void fetch("/api/tasks/templates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: templateId, sortOrder: i }),
        }).catch(() => {});
      }
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to reorder tasks");
    }
  }, [schedule]);

  // Copy a task into the same block. The copy lands at the end (max
  // sortOrder + 1) so it's easy to find and drag into place. Repeating
  // originals duplicate the TEMPLATE (same days) so the copy repeats too.
  const duplicateTask = useCallback(async (blockIdx: number, taskIdx: number) => {
    const block = schedule[blockIdx];
    const task = block?.tasks[taskIdx] as TaskWithId | undefined;
    if (!block || !task) return;
    const copyText = `${task.task} (copy)`;
    const sortOrder =
      block.tasks.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1) + 1;
    const shared = {
      task: copyText,
      block: block.name,
      category: task.category,
      tags: task.tags && task.tags.length > 0 ? task.tags : [task.category],
      assignedTo: task.assignedTo,
      animalSpecific: task.animalSpecific,
      note: task.note,
      sortOrder,
    };

    try {
      if (task.templateId) {
        // Same repeat days as the original's template.
        let repeatDays: number[] = [];
        try {
          const tRes = await fetch("/api/tasks/templates", { cache: "no-store" });
          if (tRes.ok) {
            const body = (await tRes.json()) as { templates: { id: string; repeatDays: number[] }[] };
            repeatDays = body.templates.find((t) => t.id === task.templateId)?.repeatDays ?? [];
          }
        } catch {
          // Fall back to every day.
        }
        const res = await fetch("/api/tasks/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...shared, repeatDays }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to duplicate");
        await refresh();
        return;
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...shared,
          date: currentDateRef.current,
          sticky: task.sticky === true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to duplicate");
      const body = (await res.json()) as { task: ApiTask };
      const newTask = apiToTask(body.task);
      setTaskBlocks((prev) => {
        const next = new Map(prev);
        next.set(body.task.id, body.task.block);
        return next;
      });
      setSchedule((prev) =>
        prev.map((b) => (b.name === body.task.block ? { ...b, tasks: [...b.tasks, newTask] } : b))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to duplicate task");
    }
  }, [schedule, refresh]);

  // ── Multi-select bulk actions (addressed by server id) ──

  const bulkComplete = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    const snapshot = localUpdate((prev) =>
      prev.map((b) => ({
        ...b,
        tasks: b.tasks.map((t) =>
          (t as TaskWithId).serverId && idSet.has((t as TaskWithId).serverId!)
            ? { ...t, done: true }
            : t
        ),
      }))
    );
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("/api/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, done: true }),
          }).then((r) => {
            if (!r.ok) throw new Error("patch failed");
          })
        )
      );
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to complete tasks");
    }
  }, [schedule]);

  const bulkMove = useCallback(async (ids: string[], blockName: string) => {
    const idSet = new Set(ids);
    const target = schedule.find((b) => b.name === blockName);
    if (!target) return;
    // Moved tasks land at the END of the target block, keeping their
    // relative order.
    let nextOrder =
      target.tasks.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1) + 1;
    const moving: TaskWithId[] = [];
    for (const b of schedule) {
      if (b.name === blockName) continue;
      for (const t of b.tasks) {
        const tw = t as TaskWithId;
        if (tw.serverId && idSet.has(tw.serverId)) moving.push(tw);
      }
    }
    if (moving.length === 0) return;
    const orders = new Map(moving.map((t) => [t.serverId!, nextOrder++]));

    const snapshot = localUpdate((prev) =>
      prev.map((b) => {
        const kept = b.tasks.filter(
          (t) => !((t as TaskWithId).serverId && orders.has((t as TaskWithId).serverId!))
        );
        if (b.name !== blockName) return { ...b, tasks: kept };
        return {
          ...b,
          tasks: [
            ...kept,
            ...moving.map((t) => ({ ...t, sortOrder: orders.get(t.serverId!) })),
          ],
        };
      })
    );

    try {
      await Promise.all(
        moving.map((t) =>
          fetch("/api/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: t.serverId, block: blockName, sortOrder: orders.get(t.serverId!) }),
          }).then((r) => {
            if (!r.ok) throw new Error("patch failed");
          })
        )
      );
      setTaskBlocks((prev) => {
        const next = new Map(prev);
        for (const t of moving) next.set(t.serverId!, blockName);
        return next;
      });
      // Write through to the templates so the move carries to future days.
      for (const t of moving) {
        if (!t.templateId) continue;
        void fetch("/api/tasks/templates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.templateId, block: blockName, sortOrder: orders.get(t.serverId!) }),
        }).catch(() => {});
      }
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to move tasks");
    }
  }, [schedule]);

  const bulkAssignTo = useCallback(async (ids: string[], memberName: string) => {
    const idSet = new Set(ids);
    const patches: Array<{ id: string; assignedTo: string }> = [];
    const snapshot = localUpdate((prev) =>
      prev.map((b) => ({
        ...b,
        tasks: b.tasks.map((t) => {
          const tw = t as TaskWithId;
          if (!tw.serverId || !idSet.has(tw.serverId)) return t;
          const list = t.assignedTo ? t.assignedTo.split(", ").filter(Boolean) : [];
          if (list.includes(memberName)) return t;
          const next = [...list, memberName].join(", ");
          patches.push({ id: tw.serverId, assignedTo: next });
          return { ...t, assignedTo: next };
        }),
      }))
    );
    try {
      await Promise.all(
        patches.map((p) =>
          fetch("/api/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          }).then((r) => {
            if (!r.ok) throw new Error("patch failed");
          })
        )
      );
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to assign tasks");
    }
  }, [schedule]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    const snapshot = localUpdate((prev) =>
      prev.map((b) => ({
        ...b,
        tasks: b.tasks.filter(
          (t) => !((t as TaskWithId).serverId && idSet.has((t as TaskWithId).serverId!))
        ),
      }))
    );
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => {
            if (!r.ok) throw new Error("delete failed");
          })
        )
      );
      setTaskBlocks((prev) => {
        const next = new Map(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to delete tasks");
    }
  }, [schedule]);

  // Record how a task actually went ("" normal / "partial" / "refused" +
  // an optional why) — the appetite-capture ask: "Swayze only ate a couple
  // of bites". Stored on the DAY's row, so it's part of history.
  const setOutcome = useCallback(async (
    blockIdx: number,
    taskIdx: number,
    outcome: "" | "partial" | "refused" | "issue",
    outcomeNote: string
  ) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;
    const snapshot = localUpdate((prev) =>
      prev.map((b, bi) =>
        bi === blockIdx
          ? {
              ...b,
              tasks: b.tasks.map((t, ti) =>
                ti === taskIdx ? { ...t, outcome, outcomeNote } : t
              ),
            }
          : b
      )
    );
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ids.serverId, outcome, outcomeNote }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
    } catch (e) {
      setSchedule(snapshot);
      setError(e instanceof Error ? e.message : "Failed to save outcome");
    }
  }, [schedule]);

  // Deactivate a recurring template. The current day's instance stays (it's
  // already materialized); future days simply stop getting the task.
  const stopRepeating = useCallback(async (templateId: string) => {
    try {
      const res = await fetch("/api/tasks/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateId, active: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to stop");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop repeating task");
    }
  }, [refresh]);

  const resetSchedule = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        toggleTask,
        assignTask,
        bulkAssign,
        addTask,
        editTask,
        deleteTask,
        reorderTask,
        duplicateTask,
        bulkComplete,
        bulkMove,
        bulkAssignTo,
        bulkDelete,
        setOutcome,
        stopRepeating,
        resetSchedule,
        refresh,
        currentDate,
        loading,
        error,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}
