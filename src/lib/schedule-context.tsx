"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  /** ISO date (YYYY-MM-DD). Defaults to today. Used for scheduling tasks ahead. */
  date?: string;
}

export interface EditTaskInput {
  task?: string;
  assignedTo?: string;
  animalSpecific?: string;
  note?: string;
  blockName?: string;
}

interface ScheduleContextValue {
  schedule: ScheduleBlock[];
  toggleTask: (blockIdx: number, taskIdx: number) => Promise<void>;
  assignTask: (blockIdx: number, taskIdx: number, memberName: string) => Promise<void>;
  bulkAssign: (blockIdx: number, memberName: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<void>;
  editTask: (blockIdx: number, taskIdx: number, updates: EditTaskInput) => Promise<void>;
  deleteTask: (blockIdx: number, taskIdx: number) => Promise<void>;
  resetSchedule: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

function currentBlockName(): "AM" | "Mid" | "PM" {
  const hour = new Date().getHours();
  if (hour < 10) return "AM";
  if (hour < 16) return "Mid";
  return "PM";
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

// ── Augmented ScheduleTask with the server-side id ──
// We keep the existing ScheduleTask shape so components can stay unchanged.
// `serverId` is attached as an extra property (ignored by components) so
// mutations can look up the DB row to update.
type TaskWithId = ScheduleTask & { serverId?: string };

interface ApiTask {
  id: string;
  task: string;
  block: string;
  category: string;
  date: string;
  assignedTo: string | null;
  done: boolean;
  note: string | null;
  animalSpecific: string | null;
  templateId: string | null;
  createdAt: string;
}

function apiToTask(a: ApiTask): TaskWithId {
  return {
    task: a.task,
    assignedTo: a.assignedTo || undefined,
    done: a.done,
    animalSpecific: a.animalSpecific || undefined,
    note: a.note || undefined,
    category: (a.category as TaskCategory) || "routine",
    source: (a.templateId ? "base" : "manual") as TaskSource,
    serverId: a.id,
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

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
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
    const todayIso = new Date().toISOString().split("T")[0];
    const taskDate = input.date || todayIso;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: input.task,
          block,
          category: input.category ?? "routine",
          assignedTo: input.assignedTo,
          animalSpecific: input.animalSpecific,
          note: input.note,
          date: taskDate,
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
      // Only splice into today's schedule view when the task is actually for
      // today. Future-dated tasks will surface when the user views that date.
      if (taskDate === todayIso) {
        setSchedule((prev) =>
          prev.map((b) => (b.name === body.task.block ? { ...b, tasks: [...b.tasks, newTask] } : b))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task");
    }
  }, []);

  const editTask = useCallback(async (blockIdx: number, taskIdx: number, updates: EditTaskInput) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;
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
      if (moving) patchBody.block = updates.blockName;

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to edit");

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

  const deleteTask = useCallback(async (blockIdx: number, taskIdx: number) => {
    const ids = resolveIds(blockIdx, taskIdx);
    if (!ids) return;

    const snapshot = localUpdate((prev) =>
      prev.map((b, bi) =>
        bi === blockIdx ? { ...b, tasks: b.tasks.filter((_, ti) => ti !== taskIdx) } : b
      )
    );

    try {
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
        resetSchedule,
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
