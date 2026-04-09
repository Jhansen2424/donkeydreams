"use client";

import { useMemo } from "react";
import MetricTabs from "@/components/app/dashboard/MetricTabs";
import SanctuaryStats from "@/components/app/dashboard/SanctuaryStats";
import DashboardTaskList from "@/components/app/dashboard/DashboardTaskList";
import DashboardCalendar, { todayEvents } from "@/components/app/dashboard/DashboardCalendar";
import WatchAndMedical from "@/components/app/dashboard/WatchAndMedical";
import UnassignedTasks from "@/components/app/dashboard/UnassignedTasks";
import { useSchedule } from "@/lib/schedule-context";
import { watchList } from "@/lib/sanctuary-data";
import { upcomingMedical } from "@/lib/animals";

export default function AppDashboard() {
  const { schedule, toggleTask, assignTask } = useSchedule();

  const { tasksTotal, tasksDone } = useMemo(() => {
    let total = 0;
    let done = 0;
    schedule.forEach((b) => {
      total += b.tasks.length;
      done += b.tasks.filter((t) => t.done).length;
    });
    return { tasksTotal: total, tasksDone: done };
  }, [schedule]);

  // Count today's calendar events that aren't already represented as tasks
  // (vet visits, farrier appointments, special events).
  const appointmentsToday = useMemo(
    () => todayEvents.filter((e) => e.type !== "task").length,
    []
  );

  // Upcoming medical events in the next 7 days. The data is hardcoded
  // April dates so we just count the first 7 entries as a stand-in.
  const upcomingMedicalCount = Math.min(upcomingMedical.length, 7);

  return (
    <div className="space-y-5">
      {/* ── Metric tabs ── */}
      <MetricTabs
        tasksDone={tasksDone}
        tasksTotal={tasksTotal}
        appointmentsToday={appointmentsToday}
        watchCount={watchList.length}
        upcomingMedicalCount={upcomingMedicalCount}
      />

      {/* ── Sanctuary At a Glance (adoption-CSV stats) ── */}
      <SanctuaryStats />

      {/* ── Three-column workspace ── */}
      <div className="grid gap-5 lg:grid-cols-3 lg:auto-rows-fr lg:[grid-template-rows:minmax(0,calc(100vh-16rem))]">
        {/* Column 1: Task list filtered by Admin / Ranch / Care */}
        <div className="min-h-[420px] lg:min-h-0 flex flex-col">
          <DashboardTaskList schedule={schedule} onToggle={toggleTask} />
        </div>

        {/* Column 2: Calendar of today's events */}
        <div className="min-h-[420px] lg:min-h-0 flex flex-col">
          <DashboardCalendar />
        </div>

        {/* Column 3: Donkeys to Watch + Upcoming Medical */}
        <div className="min-h-[420px] lg:min-h-0 flex flex-col">
          <WatchAndMedical watchList={watchList} upcomingMedical={upcomingMedical} />
        </div>
      </div>

      {/* ── Unassigned tasks (full width below the workspace) ── */}
      <UnassignedTasks schedule={schedule} onAssign={assignTask} />
    </div>
  );
}
