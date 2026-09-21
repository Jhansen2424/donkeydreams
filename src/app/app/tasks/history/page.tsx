"use client";

// Task history (client 9/10: "we need to see what days Gabriel got his meds
// and what days were missed"). Every day's checklist has been stored since
// the routines went live — this page finally shows it. Two views:
//   By day    — each date's tasks with done / missed / partial / refused.
//   Summary   — per task: days done vs days it appeared, first/last dates
//               (answers "when did we start this medicine?").
// Deep-linkable: ?animal=Gabriel preselects the donkey filter (the profile
// Daily Care tab links here).

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, History, Search, Check, X as XIcon } from "lucide-react";
import { useAnimals } from "@/lib/animals-context";
import { formatDate } from "@/lib/format-date";
import { localToday } from "@/lib/schedule-context";

interface HistoryTask {
  id: string;
  task: string;
  block: string;
  date: string;
  done: boolean;
  animalSpecific: string | null;
  assignedTo: string | null;
  outcome: string;
  outcomeNote: string;
  templateId: string | null;
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

export default function TaskHistoryPage() {
  return (
    <Suspense fallback={null}>
      <TaskHistoryInner />
    </Suspense>
  );
}

function TaskHistoryInner() {
  const searchParams = useSearchParams();
  const { animals } = useAnimals();
  const today = localToday();

  const [from, setFrom] = useState(() => shiftDate(localToday(), -13));
  const [to, setTo] = useState(today);
  const [animal, setAnimal] = useState(searchParams?.get("animal") ?? "all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"days" | "summary">("days");
  const [rows, setRows] = useState<HistoryTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tasks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const body = (await res.json()) as { tasks: HistoryTask[] };
        if (!cancelled) setRows(body.tasks);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (animal !== "all" && r.animalSpecific !== animal) return false;
      if (
        q &&
        !r.task.toLowerCase().includes(q) &&
        !(r.animalSpecific ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, animal, search]);

  // ── By day: newest first ──
  const byDay = useMemo(() => {
    const m = new Map<string, HistoryTask[]>();
    for (const r of filtered) {
      const arr = m.get(r.date) ?? [];
      arr.push(r);
      m.set(r.date, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // ── Summary: per task (name + animal), stats across the range ──
  const summary = useMemo(() => {
    const m = new Map<
      string,
      {
        task: string;
        animal: string | null;
        appeared: number;
        done: number;
        missed: number;
        partial: number;
        refused: number;
        first: string;
        last: string;
      }
    >();
    for (const r of filtered) {
      const key = `${r.task}::${r.animalSpecific ?? ""}`;
      const e =
        m.get(key) ??
        {
          task: r.task,
          animal: r.animalSpecific,
          appeared: 0,
          done: 0,
          missed: 0,
          partial: 0,
          refused: 0,
          first: r.date,
          last: r.date,
        };
      e.appeared++;
      if (r.done) e.done++;
      // Only PAST days count as missed — today isn't over yet.
      else if (r.date < today) e.missed++;
      if (r.outcome === "partial") e.partial++;
      if (r.outcome === "refused") e.refused++;
      if (r.date < e.first) e.first = r.date;
      if (r.date > e.last) e.last = r.date;
      m.set(key, e);
    }
    return Array.from(m.values()).sort(
      (a, b) => b.missed - a.missed || b.appeared - a.appeared
    );
  }, [filtered, today]);

  const missedTotal = summary.reduce((s, r) => s + r.missed, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/tasks"
            className="p-2 rounded-lg bg-white border border-card-border text-charcoal hover:bg-cream"
            title="Back to Daily Routine"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              <History className="w-6 h-6 text-sidebar" />
              Task History
            </h1>
            <p className="text-sm text-warm-gray mt-0.5">
              What was done, missed, or refused — every day is kept.
            </p>
          </div>
        </div>
        <div className="inline-flex bg-white border border-card-border rounded-lg overflow-hidden self-start">
          {(
            [
              ["days", "By Day"],
              ["summary", "Summary"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === value ? "bg-sidebar text-white" : "text-charcoal hover:bg-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => e.target.value && setFrom(e.target.value)}
          className="px-2 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white"
        />
        <span className="text-warm-gray text-sm">to</span>
        <input
          type="date"
          value={to}
          min={from}
          max={today}
          onChange={(e) => e.target.value && setTo(e.target.value)}
          className="px-2 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white"
        />
        <select
          value={animal}
          onChange={(e) => setAnimal(e.target.value)}
          className="px-2 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white"
        >
          <option value="all">All donkeys</option>
          {animals
            .filter((a) => a.status !== "Deceased")
            .map((a) => (
              <option key={a.slug} value={a.name}>
                {a.name}
              </option>
            ))}
        </select>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
          />
        </div>
        {missedTotal > 0 && (
          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            {missedTotal} missed in range
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-warm-gray/60 py-10 text-center">Loading history…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-warm-gray/60 py-10 text-center">
          No task records in this range. History starts the day a routine or
          task first ran.
        </p>
      ) : view === "summary" ? (
        <div className="bg-white rounded-xl border border-card-border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 border-b border-card-border">
                <th className="px-4 py-2.5">Task</th>
                <th className="px-2 py-2.5">Donkey</th>
                <th className="px-2 py-2.5">Done</th>
                <th className="px-2 py-2.5">Missed</th>
                <th className="px-2 py-2.5">Partial</th>
                <th className="px-2 py-2.5">Refused</th>
                <th className="px-2 py-2.5">First</th>
                <th className="px-4 py-2.5">Last</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r) => (
                <tr key={`${r.task}-${r.animal}`} className="border-b border-card-border/50">
                  <td className="px-4 py-2 font-medium text-charcoal">{r.task}</td>
                  <td className="px-2 py-2 text-sky-dark">{r.animal ?? "—"}</td>
                  <td className="px-2 py-2 text-emerald-700 font-semibold">
                    {r.done}/{r.appeared}
                  </td>
                  <td className={`px-2 py-2 font-semibold ${r.missed > 0 ? "text-red-600" : "text-warm-gray/50"}`}>
                    {r.missed}
                  </td>
                  <td className={`px-2 py-2 ${r.partial > 0 ? "text-amber-700 font-semibold" : "text-warm-gray/50"}`}>
                    {r.partial}
                  </td>
                  <td className={`px-2 py-2 ${r.refused > 0 ? "text-red-600 font-semibold" : "text-warm-gray/50"}`}>
                    {r.refused}
                  </td>
                  <td className="px-2 py-2 text-warm-gray whitespace-nowrap">{formatDate(r.first)}</td>
                  <td className="px-4 py-2 text-warm-gray whitespace-nowrap">{formatDate(r.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.map(([date, tasks]) => {
            const done = tasks.filter((t) => t.done).length;
            return (
              <div key={date} className="bg-white rounded-xl border border-card-border overflow-hidden">
                <div className="px-4 py-2.5 bg-cream/60 border-b border-card-border flex items-center justify-between">
                  <p className="text-sm font-bold text-charcoal">{formatDate(date)}</p>
                  <p className="text-xs text-warm-gray">
                    {done}/{tasks.length} done
                  </p>
                </div>
                <div className="divide-y divide-card-border/60">
                  {tasks.map((t) => {
                    const missed = !t.done && t.date < today;
                    return (
                      <div key={t.id} className="px-4 py-2 flex items-center gap-3">
                        {t.done ? (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : missed ? (
                          <XIcon className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded border-2 border-card-border shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${missed ? "text-red-700" : "text-charcoal"}`}>
                            {t.task}
                            {t.animalSpecific && (
                              <span className="ml-1.5 text-xs text-sky-dark">{t.animalSpecific}</span>
                            )}
                          </p>
                          {t.outcomeNote && (
                            <p className="text-[11px] text-amber-800 truncate">{t.outcomeNote}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {t.outcome === "partial" && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              Partial
                            </span>
                          )}
                          {t.outcome === "refused" && (
                            <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              Refused
                            </span>
                          )}
                          <span className="text-[10px] uppercase tracking-wide text-warm-gray/50">
                            {t.block}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
