"use client";

import { useMemo, useState } from "react";
import MetricTabs from "@/components/app/dashboard/MetricTabs";
import SanctuaryStats from "@/components/app/dashboard/SanctuaryStats";
import DashboardTaskList from "@/components/app/dashboard/DashboardTaskList";
import DashboardCalendar, { todayEvents } from "@/components/app/dashboard/DashboardCalendar";
import WatchAndMedical from "@/components/app/dashboard/WatchAndMedical";
import UnassignedTasks from "@/components/app/dashboard/UnassignedTasks";
import ParkingLot from "@/components/app/dashboard/ParkingLot";
import TaskEditModal, { type TaskEditModalMode } from "@/components/app/TaskEditModal";
import { useSchedule } from "@/lib/schedule-context";
import { formatDate as sharedFormatDate } from "@/lib/format-date";
import { useParkingLot } from "@/lib/parking-lot-context";
import { useMedical } from "@/lib/medical-context";
import { watchList, type WatchListEntry } from "@/lib/sanctuary-data";
import { upcomingMedical } from "@/lib/animals";

export default function AppDashboard() {
  const { schedule, toggleTask, assignTask } = useSchedule();
  const { entries: parkingEntries } = useParkingLot();
  const { entries: medicalEntries } = useMedical();
  const [modalMode, setModalMode] = useState<TaskEditModalMode | null>(null);

  // Merge parking-lot watch entries with the seed watchList so newly-added
  // alerts appear on the dashboard immediately.
  const mergedWatch: WatchListEntry[] = useMemo(() => {
    const fromParking: WatchListEntry[] = parkingEntries
      .filter((e) => e.type === "watch" && !e.resolved)
      .map((e) => ({
        date: sharedFormatDate(e.timestamp),
        animal: e.data?.animal || "—",
        issue: e.text,
        treatment: e.data?.title || "",
        assignedTo: e.data?.assignee || "",
        severity: (e.data?.severity as "high" | "medium" | "low") || "medium",
      }));
    return [...fromParking, ...watchList];
  }, [parkingEntries]);

  // Upcoming medical = real medical entries dated today or later, sorted
  // ascending. Falls back to the (hardcoded) `upcomingMedical` seed if the DB
  // is empty, so the card never sits blank during demos.
  const mergedUpcomingMedical = useMemo(() => {
    const todayIso = new Date().toISOString().split("T")[0];
    const live = medicalEntries
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: sharedFormatDate(e.date),
        name: e.animal,
        description: e.title,
        urgent: e.urgent,
      }));
    return live.length > 0 ? live : upcomingMedical;
  }, [medicalEntries]);

  const openAdd = () => setModalMode({ kind: "add" });
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

  // Upcoming medical events in the next 7 days — prefer live counts so the
  // metric chip matches the list below.
  const upcomingMedicalCount = Math.min(mergedUpcomingMedical.length, 7);

  return (
    <div className="space-y-5">
      {/* ── Metric tabs ── */}
      <MetricTabs
        tasksDone={tasksDone}
        tasksTotal={tasksTotal}
        appointmentsToday={appointmentsToday}
        watchCount={mergedWatch.length}
        upcomingMedicalCount={upcomingMedicalCount}
      />

      {/* ── Sanctuary At a Glance (adoption-CSV stats) ── */}
      <SanctuaryStats />

      {/* ── Three-column workspace ── */}
      <div className="grid gap-5 lg:grid-cols-3 lg:auto-rows-fr lg:[grid-template-rows:minmax(0,calc(100vh-16rem))]">
        {/* Column 1: Task list filtered by Admin / Ranch / Care */}
        <div className="min-h-[420px] lg:min-h-0 flex flex-col">
          <DashboardTaskList
            schedule={schedule}
            onToggle={toggleTask}
            onEdit={openEdit}
            onAdd={openAdd}
          />
        </div>

        {/* Column 2: Calendar of today's events */}
        <div className="min-h-[420px] lg:min-h-0 flex flex-col">
          <DashboardCalendar />
        </div>

        {/* Column 3: Donkeys to Watch + Upcoming Medical */}
        <div className="min-h-[420px] lg:min-h-0 flex flex-col">
          <WatchAndMedical watchList={mergedWatch} upcomingMedical={mergedUpcomingMedical} />
        </div>
      </div>

      {/* ── Unassigned tasks (full width below the workspace) ── */}
      <UnassignedTasks schedule={schedule} onAssign={assignTask} />

      {/* ── Notes inbox (quick triage) ── */}
      <ParkingLot />

      {/* Add/edit modal for the Task List card */}
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
