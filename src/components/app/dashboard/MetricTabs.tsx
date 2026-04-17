"use client";

import { ClipboardCheck, CalendarDays, AlertTriangle, Stethoscope, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Metric {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  accent: string; // tailwind classes for the colored bar / icon
}

interface MetricTabsProps {
  tasksDone: number;
  tasksTotal: number;
  appointmentsToday: number;
  watchCount: number;
  upcomingMedicalCount: number;
}

export default function MetricTabs({
  tasksDone,
  tasksTotal,
  appointmentsToday,
  watchCount,
  upcomingMedicalCount,
}: MetricTabsProps) {
  const router = useRouter();

  const metrics: Metric[] = [
    {
      id: "tasks",
      label: "Tasks Today",
      value: `${tasksDone}/${tasksTotal}`,
      subtitle: tasksTotal > 0
        ? `${Math.round((tasksDone / tasksTotal) * 100)}% complete`
        : "No tasks scheduled",
      icon: ClipboardCheck,
      href: "/app/tasks",
      accent: "from-sky/20 to-sky/5 text-sky border-sky/30",
    },
    {
      id: "appointments",
      label: "Today's Appointments",
      value: String(appointmentsToday),
      subtitle: appointmentsToday === 1 ? "scheduled event" : "scheduled events",
      icon: CalendarDays,
      href: "/app",
      accent: "from-purple-200 to-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "watch",
      label: "Watch List",
      value: String(watchCount),
      subtitle: watchCount === 1 ? "donkey to watch" : "donkeys to watch",
      icon: AlertTriangle,
      href: "/app/watch",
      accent: "from-red-200 to-red-50 text-red-700 border-red-200",
    },
    {
      id: "medical",
      label: "Upcoming Medical",
      value: String(upcomingMedicalCount),
      subtitle: "in the next 7 days",
      icon: Stethoscope,
      href: "/app/medical",
      accent: "from-amber-200 to-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            onClick={() => router.push(m.href)}
            className={`text-left bg-gradient-to-br ${m.accent} bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-charcoal/70">
                {m.label}
              </p>
              <Icon className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-charcoal leading-none mb-1">
              {m.value}
            </p>
            <p className="text-[11px] text-charcoal/60 font-medium">{m.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
