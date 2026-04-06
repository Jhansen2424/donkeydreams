"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { volunteers } from "@/lib/volunteer-data";
import type { ScheduleBlock } from "@/lib/sanctuary-data";

interface VolunteerLoad {
  name: string;
  initials: string;
  assignedMinutes: number;
  committedMinutes: number;
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

export default function VolunteerLoadBar({ schedule }: { schedule: ScheduleBlock[] }) {
  const loads = useMemo(() => {
    // Only active volunteers
    const active = volunteers.filter((v) => v.status === "active");

    // Count assigned minutes per person
    const minutesByName = new Map<string, number>();
    for (const block of schedule) {
      for (const task of block.tasks) {
        if (!task.assignedTo) continue;
        const names = task.assignedTo.split(", ").filter(Boolean);
        const perPerson = (task.estimatedMinutes ?? 10) / names.length;
        for (const name of names) {
          minutesByName.set(name, (minutesByName.get(name) ?? 0) + perPerson);
        }
      }
    }

    return active.map((v, i): VolunteerLoad => ({
      name: v.name,
      initials: v.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2),
      assignedMinutes: Math.round(minutesByName.get(v.name) ?? 0),
      committedMinutes: v.committedHoursPerDay * 60,
      color: teamColors[i % teamColors.length],
    }));
  }, [schedule]);

  // Only show volunteers who have any assigned tasks or committed hours > 0
  const relevant = loads.filter((l) => l.assignedMinutes > 0 || l.committedMinutes > 0);

  if (relevant.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-card-border p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-3">
        Team Workload Today
      </h3>
      <div className="space-y-2.5">
        {relevant.map((load) => {
          const pct = load.committedMinutes > 0
            ? Math.min(Math.round((load.assignedMinutes / load.committedMinutes) * 100), 100)
            : 0;
          const overflowPct = load.committedMinutes > 0
            ? Math.round((load.assignedMinutes / load.committedMinutes) * 100)
            : 0;
          const isOver = overflowPct > 100;
          const isNear = overflowPct >= 80 && overflowPct <= 100;
          const barColor = isOver
            ? "bg-red-500"
            : isNear
              ? "bg-amber-500"
              : "bg-emerald-500";

          const assignedHrs = (load.assignedMinutes / 60).toFixed(1);
          const committedHrs = (load.committedMinutes / 60).toFixed(0);

          return (
            <div key={load.name} className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${load.color}`}
              >
                {load.initials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-charcoal truncate">
                    {load.name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-warm-gray shrink-0">
                    {isOver && <AlertTriangle className="w-3 h-3 text-red-500" />}
                    {assignedHrs}h / {committedHrs}h
                  </span>
                </div>
                <div className="w-full bg-cream rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
