"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Heart, AlertTriangle, ClipboardCheck, Users } from "lucide-react";
import StatCard from "@/components/app/StatCard";
import MedicalTimeline from "@/components/app/MedicalTimeline";
import UnassignedTasks from "@/components/app/dashboard/UnassignedTasks";
import DashboardCalendar from "@/components/app/dashboard/DashboardCalendar";
import TaskSummaryCards from "@/components/app/dashboard/TaskSummaryCards";
import ParkingLot from "@/components/app/dashboard/ParkingLot";
import { useSchedule } from "@/lib/schedule-context";
import {
  watchList,
  type WatchListEntry,
} from "@/lib/sanctuary-data";
import {
  animals,
  getSpecialNeedsAnimals,
  getCareAlerts,
  upcomingMedical,
} from "@/lib/animals";

const specialNeeds = getSpecialNeedsAnimals();
const careAlerts = getCareAlerts();

const severityBorder = {
  high: "border-red-200",
  medium: "border-amber-200",
  low: "border-emerald-200",
};

const severityDot = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

function WatchItem({ entry }: { entry: WatchListEntry }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg bg-cream/50 border ${severityBorder[entry.severity]}`}>
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full ${severityDot[entry.severity]}`} />
        <p className="text-[10px] text-warm-gray/50 font-medium">{entry.date}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm">{entry.animal}</p>
        <p className="text-sm text-warm-gray">{entry.issue}</p>
        <p className="text-xs text-warm-gray/70 mt-1">{entry.treatment}</p>
        {entry.assignedTo && (
          <p className="text-[11px] text-sky-dark font-medium mt-1">→ {entry.assignedTo}</p>
        )}
      </div>
    </div>
  );
}

export default function AppDashboard() {
  const router = useRouter();
  const { schedule, assignTask } = useSchedule();

  const totalTasks = schedule.reduce((s, b) => s + b.tasks.length, 0);
  const doneTasks = schedule.reduce(
    (s, b) => s + b.tasks.filter((t) => t.done).length,
    0
  );

  const sortedWatchList = useMemo(
    () =>
      [...watchList].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      }),
    []
  );

  return (
    <div className="space-y-6">
      {/* ── 1. Donkeys to Watch ── */}
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-charcoal text-lg">Donkeys to Watch</h3>
            <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {watchList.length}
            </span>
          </div>
          <button
            onClick={() => router.push("/app/watch")}
            className="text-xs font-medium text-sky hover:text-sky-dark transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {sortedWatchList.map((entry, i) => (
            <WatchItem key={i} entry={entry} />
          ))}
        </div>
      </div>

      {/* ── 2. Parking Lot — quick input entries needing action ── */}
      <ParkingLot />

      {/* ── 3. Unassigned Tasks ── */}
      <UnassignedTasks schedule={schedule} onAssign={assignTask} />

      {/* ── 3. Tasks Overview + Calendar ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TaskSummaryCards
          schedule={schedule}
          onNavigateToTasks={() => router.push("/app/tasks")}
        />
        <DashboardCalendar />
      </div>

      {/* ── 4. Upcoming Medical Care ── */}
      <MedicalTimeline events={upcomingMedical} />

      {/* ── 5. Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Animals"
          value={animals.length}
          subtitle="9 herds across property"
          icon={Heart}
        />
        <StatCard
          label="Special Needs"
          value={specialNeeds.length}
          subtitle={specialNeeds.map((a) => a.name).join(", ")}
          icon={Users}
        />
        <StatCard
          label="Care Alerts"
          value={careAlerts}
          subtitle="Need attention this month"
          icon={AlertTriangle}
          highlight
        />
        <StatCard
          label="Tasks Today"
          value={`${doneTasks}/${totalTasks}`}
          subtitle={`${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% complete`}
          icon={ClipboardCheck}
        />
      </div>
    </div>
  );
}
