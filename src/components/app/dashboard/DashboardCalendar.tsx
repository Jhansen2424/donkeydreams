"use client";

import { CalendarDays, Clock } from "lucide-react";

interface CalendarEvent {
  time: string;
  title: string;
  type: "vet" | "farrier" | "event" | "task";
  animal?: string;
}

const eventStyles: Record<string, { bg: string; border: string; dot: string }> = {
  vet: { bg: "bg-sky/5", border: "border-sky/20", dot: "bg-sky" },
  farrier: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  event: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  task: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
};

// Hardcoded sample events for now — will connect to real calendar later
const todayEvents: CalendarEvent[] = [
  { time: "6:00 AM", title: "Morning feed & supplements", type: "task" },
  { time: "10:30 AM", title: "Lunch prep & drop buckets", type: "task" },
  { time: "2:00 PM", title: "Dr. Moreno — Gabriel prosthetic check", type: "vet", animal: "Gabriel" },
  { time: "4:00 PM", title: "Dinner feed & evening routine", type: "task" },
  { time: "5:00 PM", title: "Put on Shelley's brace", type: "task", animal: "Shelley" },
];

export default function DashboardCalendar() {
  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-sky" />
        <h3 className="font-bold text-charcoal text-lg">Today&apos;s Schedule</h3>
      </div>

      <div className="space-y-2">
        {todayEvents.map((event, i) => {
          const style = eventStyles[event.type];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex items-center gap-2 shrink-0 w-16">
                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                <span className="text-xs font-semibold text-warm-gray">
                  {event.time}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{event.title}</p>
                {event.animal && (
                  <p className="text-[11px] text-sky-dark font-medium mt-0.5">
                    {event.animal}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
