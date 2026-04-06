"use client";

import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { feedSchedules, feedNotes, type FeedSchedule, type FeedNote } from "@/lib/sanctuary-data";

const noteStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  daily: { bg: "bg-sky/5", border: "border-sky/20", text: "text-charcoal", icon: "text-sky" },
  ongoing: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-500" },
  evergreen: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-500" },
};

const categoryLabels: Record<string, string> = {
  daily: "Daily",
  ongoing: "Ongoing",
  evergreen: "Permanent",
};

export default function FeedPage() {
  const [search, setSearch] = useState("");

  const filtered = feedSchedules.filter((f) =>
    f.animal.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Daily Feed Buckets
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {feedSchedules.length} donkeys with custom feed plans
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
          <input
            type="text"
            placeholder="Search donkey..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Important notes with category legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60">Legend:</span>
          {Object.entries(noteStyles).map(([key, style]) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-xs text-warm-gray">
              <span className={`w-2.5 h-2.5 rounded-full ${style.bg} border ${style.border}`} />
              {categoryLabels[key]}
            </span>
          ))}
        </div>
        {feedNotes.map((note, i) => {
          const style = noteStyles[note.category];
          return (
            <div
              key={i}
              className={`flex items-start gap-2 p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${style.icon}`} />
              <div className="flex-1">
                <p className={`text-sm ${style.text}`}>{note.text}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.icon} mt-1 inline-block`}>
                  {categoryLabels[note.category]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feed grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((schedule) => (
          <FeedCard key={schedule.animal} schedule={schedule} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🫏</p>
          <p className="text-warm-gray font-medium">No feed plans found</p>
        </div>
      )}
    </div>
  );
}

function FeedCard({ schedule }: { schedule: FeedSchedule }) {
  const meals = [
    { label: "AM", items: schedule.plan.am, color: "bg-amber-500" },
    { label: "MID", items: schedule.plan.mid, color: "bg-sky" },
    { label: "PM", items: schedule.plan.pm, color: "bg-purple-500" },
  ];

  return (
    <div className="bg-white rounded-xl border border-card-border overflow-hidden">
      {/* Header */}
      <div className="bg-sidebar px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-white">{schedule.animal}</h3>
        <div className="flex gap-1">
          {meals.map((m) => (
            <span
              key={m.label}
              className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${m.color}`}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Meal grid */}
      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60">
              <th className="text-left pb-2">Item</th>
              <th className="text-center pb-2 w-16">AM</th>
              <th className="text-center pb-2 w-16">MID</th>
              <th className="text-center pb-2 w-16">PM</th>
            </tr>
          </thead>
          <tbody>
            {getItemRows(schedule).map((row) => (
              <tr key={row.item} className="border-t border-card-border">
                <td className="py-2 font-medium text-charcoal">{row.item}</td>
                <td className="py-2 text-center text-warm-gray">
                  {row.am || "—"}
                </td>
                <td className="py-2 text-center text-warm-gray">
                  {row.mid || "—"}
                </td>
                <td className="py-2 text-center text-warm-gray">
                  {row.pm || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {schedule.notes && (
          <div className="mt-3 p-2.5 bg-cream/50 rounded-lg">
            <p className="text-xs text-warm-gray leading-relaxed">
              {schedule.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Combine AM/MID/PM into unified rows by item name
function getItemRows(schedule: FeedSchedule) {
  const items = new Map<
    string,
    { item: string; am: string; mid: string; pm: string }
  >();

  for (const entry of schedule.plan.am) {
    if (!items.has(entry.item))
      items.set(entry.item, { item: entry.item, am: "", mid: "", pm: "" });
    items.get(entry.item)!.am = entry.amount;
  }
  for (const entry of schedule.plan.mid) {
    if (!items.has(entry.item))
      items.set(entry.item, { item: entry.item, am: "", mid: "", pm: "" });
    items.get(entry.item)!.mid = entry.amount;
  }
  for (const entry of schedule.plan.pm) {
    if (!items.has(entry.item))
      items.set(entry.item, { item: entry.item, am: "", mid: "", pm: "" });
    items.get(entry.item)!.pm = entry.amount;
  }

  return Array.from(items.values());
}
