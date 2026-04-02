"use client";

import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { feedSchedules, feedNotes, type FeedSchedule } from "@/lib/sanctuary-data";

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

      {/* Important notes */}
      <div className="space-y-2">
        {feedNotes.map((note, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 p-3 rounded-lg border ${
              i === 1
                ? "bg-red-50 border-red-200"
                : i === 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-sky/5 border-sky/20"
            }`}
          >
            <AlertCircle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                i === 1 ? "text-red-500" : i === 0 ? "text-amber-500" : "text-sky"
              }`}
            />
            <p
              className={`text-sm ${
                i === 1
                  ? "text-red-800"
                  : i === 0
                    ? "text-amber-800"
                    : "text-charcoal"
              }`}
            >
              {note}
            </p>
          </div>
        ))}
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
