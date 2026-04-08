"use client";

import { CalendarDays } from "lucide-react";

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
export const todayEvents: CalendarEvent[] = [
  { time: "6:00 AM", title: "Morning feed & supplements", type: "task" },
  { time: "10:30 AM", title: "Lunch prep & drop buckets", type: "task" },
  { time: "2:00 PM", title: "Dr. Moreno — Gabriel prosthetic check", type: "vet", animal: "Gabriel" },
  { time: "4:00 PM", title: "Dinner feed & evening routine", type: "task" },
  { time: "5:00 PM", title: "Put on Shelley's brace", type: "task", animal: "Shelley" },
];

export default function DashboardCalendar() {
  return (
    <div className="bg-white rounded-xl border border-card-border flex flex-col h-full min-h-0">
      <div className="px-5 py-4 border-b border-card-border shrink-0 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-sky" />
        <h3 className="font-bold text-charcoal text-lg">Today&apos;s Schedule</h3>
        <span className="ml-auto bg-sky/10 text-sky text-[10px] font-bold px-2 py-0.5 rounded-full">
          {todayEvents.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {todayEvents.map((event, i) => {
          const style = eventStyles[event.type];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-2.5 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex items-center gap-2 shrink-0 w-16">
                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                <span className="text-[11px] font-semibold text-warm-gray">
                  {event.time}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal leading-snug">{event.title}</p>
                {event.animal && (
                  <p className="text-[10px] text-sky-dark font-medium mt-0.5">
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
