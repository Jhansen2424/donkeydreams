"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  generateDailySchedule,
  type ScheduleBlock,
  type ScheduleTask,
  type TaskCategory,
} from "./sanctuary-data";

export interface NewTaskInput {
  task: string;
  blockName?: string; // "Breakfast" | "Lunch" | "Dinner" — defaults to current time block
  assignedTo?: string;
  animalSpecific?: string;
  note?: string;
  category?: TaskCategory;
}

interface ScheduleContextValue {
  schedule: ScheduleBlock[];
  toggleTask: (blockIdx: number, taskIdx: number) => void;
  assignTask: (blockIdx: number, taskIdx: number, memberName: string) => void;
  bulkAssign: (blockIdx: number, memberName: string) => void;
  addTask: (input: NewTaskInput) => void;
  resetSchedule: () => void;
}

function currentBlockName(): "Breakfast" | "Lunch" | "Dinner" {
  const hour = new Date().getHours();
  if (hour < 10) return "Breakfast";
  if (hour < 16) return "Lunch";
  return "Dinner";
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(generateDailySchedule);

  const toggleTask = useCallback((blockIdx: number, taskIdx: number) => {
    setSchedule((prev) =>
      prev.map((block, bi) =>
        bi === blockIdx
          ? {
              ...block,
              tasks: block.tasks.map((task, ti) =>
                ti === taskIdx ? { ...task, done: !task.done } : task
              ),
            }
          : block
      )
    );
  }, []);

  const assignTask = useCallback((blockIdx: number, taskIdx: number, memberName: string) => {
    setSchedule((prev) =>
      prev.map((block, bi) =>
        bi === blockIdx
          ? {
              ...block,
              tasks: block.tasks.map((task, ti) => {
                if (ti !== taskIdx) return task;
                const current = task.assignedTo
                  ? task.assignedTo.split(", ").filter(Boolean)
                  : [];
                const next = current.includes(memberName)
                  ? current.filter((n) => n !== memberName)
                  : [...current, memberName];
                return { ...task, assignedTo: next.join(", ") || undefined };
              }),
            }
          : block
      )
    );
  }, []);

  const bulkAssign = useCallback((blockIdx: number, memberName: string) => {
    setSchedule((prev) =>
      prev.map((block, bi) => {
        if (bi !== blockIdx) return block;
        return {
          ...block,
          tasks: block.tasks.map((task) => {
            const current = task.assignedTo
              ? task.assignedTo.split(", ").filter(Boolean)
              : [];
            if (current.includes(memberName)) return task;
            return { ...task, assignedTo: [...current, memberName].join(", ") };
          }),
        };
      })
    );
  }, []);

  const addTask = useCallback((input: NewTaskInput) => {
    const targetBlock = input.blockName ?? currentBlockName();
    const newTask: ScheduleTask = {
      task: input.task,
      assignedTo: input.assignedTo,
      done: false,
      animalSpecific: input.animalSpecific,
      note: input.note,
      category: input.category ?? "routine",
      source: "manual",
    };
    setSchedule((prev) => {
      // If the target block exists, append. Otherwise fall back to the first block.
      const hasTarget = prev.some((b) => b.name === targetBlock);
      const blockToUse = hasTarget ? targetBlock : prev[0]?.name;
      return prev.map((block) =>
        block.name === blockToUse
          ? { ...block, tasks: [...block.tasks, newTask] }
          : block
      );
    });
  }, []);

  const resetSchedule = useCallback(() => {
    setSchedule(generateDailySchedule());
  }, []);

  return (
    <ScheduleContext.Provider
      value={{ schedule, toggleTask, assignTask, bulkAssign, addTask, resetSchedule }}
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
