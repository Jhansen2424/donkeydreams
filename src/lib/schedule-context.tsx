"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { generateDailySchedule, type ScheduleBlock } from "./sanctuary-data";

interface ScheduleContextValue {
  schedule: ScheduleBlock[];
  toggleTask: (blockIdx: number, taskIdx: number) => void;
  assignTask: (blockIdx: number, taskIdx: number, memberName: string) => void;
  bulkAssign: (blockIdx: number, memberName: string) => void;
  resetSchedule: () => void;
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

  const resetSchedule = useCallback(() => {
    setSchedule(generateDailySchedule());
  }, []);

  return (
    <ScheduleContext.Provider
      value={{ schedule, toggleTask, assignTask, bulkAssign, resetSchedule }}
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
