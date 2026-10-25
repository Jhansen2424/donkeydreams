"use client";

// Admin tasks: standing office work (grants, bills, filings) for Edj and
// Amber, kept apart from the daily routine. They're tasks tagged "admin"
// that stay open until checked off; they can have a due date and can repeat
// (client 10/24). This hook loads them on their own (not through the day
// being viewed on the routine), so the admin page and its full list always
// show every open one plus anything finished in the last 60 days.

import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "./offline-cache";
import { localToday } from "./schedule-context";

export type Repeat = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export const REPEAT_OPTIONS: { value: Repeat | ""; label: string }[] = [
  { value: "", label: "Doesn't repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "quarterly", label: "Every 3 months (quarterly)" },
  { value: "yearly", label: "Every year" },
];

export const REPEAT_LABEL: Record<Repeat, string> = {
  daily: "Repeats daily",
  weekly: "Repeats weekly",
  monthly: "Repeats monthly",
  quarterly: "Repeats quarterly",
  yearly: "Repeats yearly",
};

export interface AdminTask {
  id: string;
  task: string;
  note?: string;
  assignedTo?: string;
  done: boolean;
  dueDate?: string;
  repeat?: Repeat;
  completedAt?: string;
  createdAt: string;
}

export interface AdminTaskInput {
  task: string;
  note?: string;
  assignedTo?: string;
  dueDate?: string;
  repeat?: Repeat | "";
}

interface ApiTask {
  id: string;
  task: string;
  note: string | null;
  assignedTo: string | null;
  done: boolean;
  dueDate: string | null;
  repeat: string | null;
  completedAt: string | null;
  createdAt: string;
}

function fromApi(a: ApiTask): AdminTask {
  return {
    id: a.id,
    task: a.task,
    note: a.note || undefined,
    assignedTo: a.assignedTo || undefined,
    done: a.done,
    dueDate: a.dueDate || undefined,
    repeat: (a.repeat as Repeat) || undefined,
    completedAt: a.completedAt || undefined,
    createdAt: a.createdAt,
  };
}

export type DueStatus = "overdue" | "today" | "soon" | "later" | "none";

/** Where a task's due date sits relative to today ("soon" = next 7 days). */
export function dueStatus(due: string | undefined, today: string): DueStatus {
  if (!due) return "none";
  if (due < today) return "overdue";
  if (due === today) return "today";
  const week = new Date(today + "T00:00:00");
  week.setDate(week.getDate() + 7);
  return due <= week.toLocaleDateString("en-CA") ? "soon" : "later";
}

/** Open first, soonest due first (undated after dated, oldest first);
 *  finished last, most recently finished first. */
export function sortAdminTasks(list: AdminTask[]): AdminTask[] {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done) return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    if (!!a.dueDate !== !!b.dueDate) return a.dueDate ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

const CACHE_KEY = "admin-tasks";

export function useAdminTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The current list, for snapshots and reading a task before changing it.
  const tasksRef = useRef<AdminTask[]>([]);
  tasksRef.current = tasks;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?view=admin", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load");
      setTasks((body.tasks as ApiTask[]).map(fromApi));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Last saved copy first (instant, and works with no signal), then fresh.
    const cached = readCache<AdminTask[]>(CACHE_KEY);
    if (cached) {
      setTasks(cached.data);
      setLoading(false);
    }
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading) writeCache(CACHE_KEY, tasks);
  }, [tasks, loading]);

  const add = useCallback(async (input: AdminTaskInput): Promise<boolean> => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: input.task.trim(),
          block: "AM",
          tags: ["admin"],
          category: "admin",
          sticky: true,
          date: localToday(),
          note: input.note?.trim() || undefined,
          assignedTo: input.assignedTo?.trim() || undefined,
          dueDate: input.dueDate || undefined,
          repeat: input.repeat || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add");
      setTasks((prev) => [...prev, fromApi(body.task)]);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task");
      return false;
    }
  }, []);

  const update = useCallback(async (id: string, input: AdminTaskInput): Promise<boolean> => {
    const snapshot = tasksRef.current;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              task: input.task.trim() || t.task,
              note: input.note?.trim() || undefined,
              assignedTo: input.assignedTo?.trim() || undefined,
              dueDate: input.dueDate || undefined,
              repeat: input.repeat || undefined,
            }
          : t
      )
    );
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          task: input.task.trim() || undefined,
          note: input.note?.trim() ?? "",
          assignedTo: input.assignedTo?.trim() || null,
          dueDate: input.dueDate || null,
          repeat: input.repeat || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      return true;
    } catch (e) {
      setTasks(snapshot);
      setError(e instanceof Error ? e.message : "Failed to save task");
      return false;
    }
  }, []);

  const toggle = useCallback(async (id: string): Promise<boolean> => {
    const snapshot = tasksRef.current;
    const current = snapshot.find((t) => t.id === id);
    if (!current) return false;
    const nextDone = !current.done;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: nextDone, completedAt: nextDone ? new Date().toISOString() : undefined } : t
      )
    );
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: nextDone }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to update");
      // A repeating task: the next one appears (or goes away again).
      const removed = new Set<string>(body.removedNextIds ?? []);
      setTasks((prev) => {
        let out = prev.filter((t) => !removed.has(t.id));
        if (body.next && !out.some((t) => t.id === body.next.id)) out = [...out, fromApi(body.next)];
        return out;
      });
      return true;
    } catch (e) {
      setTasks(snapshot);
      setError(e instanceof Error ? e.message : "Failed to update task");
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const snapshot = tasksRef.current;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return true;
    } catch (e) {
      setTasks(snapshot);
      setError(e instanceof Error ? e.message : "Failed to delete task");
      return false;
    }
  }, []);

  return { tasks, loading, error, refresh, add, update, toggle, remove };
}
