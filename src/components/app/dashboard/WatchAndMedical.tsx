"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Stethoscope, Check } from "lucide-react";
import type { WatchListEntry } from "@/lib/sanctuary-data";

interface UpcomingMedicalEvent {
  date: string;
  name: string;
  description: string;
  urgent: boolean;
}

interface WatchAndMedicalProps {
  watchList: WatchListEntry[];
  upcomingMedical: UpcomingMedicalEvent[];
}

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

export default function WatchAndMedical({ watchList, upcomingMedical }: WatchAndMedicalProps) {
  // Local "done" state so care staff can tick off an upcoming medical item
  // from the dashboard. Keyed by "date|name|description" so it survives
  // list re-renders.
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const keyFor = (e: UpcomingMedicalEvent) => `${e.date}|${e.name}|${e.description}`;
  const toggleDone = (e: UpcomingMedicalEvent) => {
    setDoneKeys((prev) => {
      const next = new Set(prev);
      const k = keyFor(e);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const sortedWatch = [...watchList].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* ── Donkeys to Watch ── */}
      <div className="bg-white rounded-xl border border-red-200 flex flex-col min-h-0 flex-1">
        <div className="px-5 py-4 border-b border-card-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-charcoal text-base">Donkeys to Watch</h3>
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {watchList.length}
            </span>
          </div>
          <Link href="/app/watch" className="text-[11px] font-medium text-sky hover:text-sky-dark">
            View all →
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {sortedWatch.length === 0 ? (
            <p className="text-xs text-warm-gray/60 text-center py-6">
              No donkeys on the watch list. 🎉
            </p>
          ) : (
            sortedWatch.map((entry, i) => (
              <div
                key={i}
                className={`flex gap-2 p-2.5 rounded-lg bg-cream/50 border ${severityBorder[entry.severity]}`}
              >
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <div className={`w-2 h-2 rounded-full ${severityDot[entry.severity]}`} />
                  <p className="text-[9px] text-warm-gray/50 font-medium">{entry.date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal text-xs">{entry.animal}</p>
                  <p className="text-xs text-warm-gray leading-snug">{entry.issue}</p>
                  {entry.assignedTo && (
                    <p className="text-[10px] text-sky-dark font-medium mt-0.5">
                      → {entry.assignedTo}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Upcoming Medical Care ── */}
      <div className="bg-white rounded-xl border border-card-border flex flex-col min-h-0 flex-1">
        <div className="px-5 py-4 border-b border-card-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-charcoal text-base">Upcoming Medical</h3>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {upcomingMedical.length}
            </span>
          </div>
          <Link href="/app/medical" className="text-[11px] font-medium text-sky hover:text-sky-dark">
            View all →
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
          {upcomingMedical.length === 0 ? (
            <p className="text-xs text-warm-gray/60 text-center py-6">
              Nothing coming up.
            </p>
          ) : (
            upcomingMedical.map((event, i) => {
              const isDone = doneKeys.has(keyFor(event));
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all ${
                    isDone
                      ? "bg-emerald-50/60 border-emerald-200 opacity-70"
                      : event.urgent
                      ? "bg-red-50/50 border-red-200"
                      : "bg-cream/40 border-card-border"
                  }`}
                >
                  <button
                    onClick={() => toggleDone(event)}
                    title={isDone ? "Mark not done" : "Mark done"}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-white border-warm-gray/30 hover:border-emerald-400"
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                  <div className="flex flex-col items-center shrink-0 w-10 pt-0.5">
                    <span className={`text-[9px] font-bold uppercase ${event.urgent && !isDone ? "text-red-600" : "text-warm-gray/60"}`}>
                      {event.date.split(" ")[0]}
                    </span>
                    <span className={`text-base font-bold leading-none ${event.urgent && !isDone ? "text-red-700" : "text-charcoal"}`}>
                      {event.date.split(" ")[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isDone ? "line-through text-warm-gray/60" : "text-charcoal"}`}>{event.name}</p>
                    <p className={`text-[11px] leading-snug ${isDone ? "line-through text-warm-gray/50" : "text-warm-gray"}`}>{event.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
