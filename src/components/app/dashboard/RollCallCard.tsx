"use client";

// Daily Roll Call: eyes on every donkey, every day. Tap a name when you've
// seen them; the card tracks today's progress and flags anyone who hasn't
// been marked seen in 48+ hours. Backed by /api/rollcall (one Sighting row
// per donkey per day), so the whole team shares one list.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Check, AlertTriangle, ChevronDown, ChevronRight, CheckCheck } from "lucide-react";
import { useAnimals } from "@/lib/animals-context";
import { localToday } from "@/lib/schedule-context";

export default function RollCallCard() {
  const { animals } = useAnimals();
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const today = localToday();

  // Roll call covers donkeys physically at the sanctuary.
  const roster = useMemo(
    () => animals.filter((a) => a.status !== "Deceased" && a.status !== "Adopted"),
    [animals]
  );

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/rollcall?date=${today}`, { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { seen: string[]; lastSeen: Record<string, string> };
      setSeen(new Set(body.seen));
      setLastSeen(body.lastSeen);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void reload();
    // Joshy's voice roll call ("mark all donkeys as seen") fires this event
    // after writing sightings, so the card updates without a page reload.
    const onChanged = () => void reload();
    window.addEventListener("dd:rollcall-changed", onChanged);
    return () => window.removeEventListener("dd:rollcall-changed", onChanged);
  }, [reload]);

  const toggle = useCallback(
    async (name: string) => {
      const wasSeen = seen.has(name);
      setSeen((prev) => {
        const next = new Set(prev);
        if (wasSeen) next.delete(name);
        else next.add(name);
        return next;
      });
      if (!wasSeen) setLastSeen((prev) => ({ ...prev, [name]: today }));
      try {
        if (wasSeen) {
          await fetch(
            `/api/rollcall?animal=${encodeURIComponent(name)}&date=${today}`,
            { method: "DELETE" }
          );
        } else {
          await fetch("/api/rollcall", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animal: name, date: today }),
          });
        }
      } catch {
        // Roll back on network failure.
        setSeen((prev) => {
          const next = new Set(prev);
          if (wasSeen) next.add(name);
          else next.delete(name);
          return next;
        });
      }
    },
    [seen, today]
  );

  const markHerd = useCallback(
    async (names: string[]) => {
      const unseen = names.filter((n) => !seen.has(n));
      if (unseen.length === 0) return;
      setSeen((prev) => {
        const next = new Set(prev);
        for (const n of unseen) next.add(n);
        return next;
      });
      setLastSeen((prev) => {
        const next = { ...prev };
        for (const n of unseen) next[n] = today;
        return next;
      });
      // Sequential to keep the serverless DB happy; idempotent on retry.
      for (const n of unseen) {
        try {
          await fetch("/api/rollcall", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ animal: n, date: today }),
          });
        } catch {
          // Leave optimistic state; a reload re-syncs from the server.
        }
      }
    },
    [seen, today]
  );

  // "Not seen in 48 hours": last sighting is 2+ days old, or never logged.
  const cutoff = useMemo(() => {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("en-CA");
  }, [today]);
  const overdue = useMemo(
    () =>
      roster
        .filter((a) => {
          const last = lastSeen[a.name];
          return !last || last < cutoff;
        })
        .map((a) => a.name),
    [roster, lastSeen, cutoff]
  );

  const byHerd = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of roster) {
      const herd = a.herd || "Unassigned";
      const arr = m.get(herd) ?? [];
      arr.push(a.name);
      m.set(herd, arr);
    }
    for (const arr of m.values()) arr.sort((x, y) => x.localeCompare(y));
    return Array.from(m.entries()).sort(([x], [y]) => x.localeCompare(y));
  }, [roster]);

  const seenToday = roster.filter((a) => seen.has(a.name)).length;
  const allSeen = seenToday === roster.length && roster.length > 0;

  return (
    <div className="bg-white rounded-xl border border-card-border">
      {/* Header — always visible; tap to expand the checklist */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-5 h-5 text-sidebar shrink-0" />
          <h3 className="font-bold text-charcoal text-lg">Roll Call</h3>
          <span
            className={`text-sm font-semibold ${
              allSeen ? "text-emerald-600" : "text-warm-gray"
            }`}
          >
            {loading ? "…" : `${seenToday}/${roster.length} seen today`}
          </span>
          {allSeen && <Check className="w-4 h-4 text-emerald-500" />}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-warm-gray shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-warm-gray shrink-0" />
        )}
      </button>

      {/* 48-hour alert — visible even when the checklist is collapsed */}
      {!loading && overdue.length > 0 && (
        <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <button
            onClick={() => setAlertOpen((v) => !v)}
            className="w-full flex items-center gap-2 text-left"
          >
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-sm font-semibold text-red-700 flex-1">
              {overdue.length} donkey{overdue.length === 1 ? "" : "s"} not seen in
              48+ hours
            </span>
            {alertOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-red-400" />
            )}
          </button>
          {alertOpen && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {overdue.map((name) => (
                <button
                  key={name}
                  onClick={() => void toggle(name)}
                  title="Tap to mark seen today"
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-red-200 text-red-700 hover:bg-red-100"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checklist, grouped by herd */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-card-border pt-4">
          <p className="text-xs text-warm-gray/70 -mt-1">
            Tap a donkey once you&apos;ve laid eyes on them today. Checkmarks
            reset each morning; the list is shared, so everyone&apos;s taps
            count.
          </p>
          {byHerd.map(([herd, names]) => {
            const herdSeen = names.filter((n) => seen.has(n)).length;
            return (
              <div key={herd}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-warm-gray/60">
                    {herd}{" "}
                    <span className="font-medium normal-case tracking-normal">
                      {herdSeen}/{names.length}
                    </span>
                  </p>
                  {herdSeen < names.length && (
                    <button
                      onClick={() => void markHerd(names)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sidebar hover:underline"
                      title={`Mark everyone in ${herd} as seen`}
                    >
                      <CheckCheck className="w-3 h-3" />
                      All seen
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {names.map((name) => {
                    const isSeen = seen.has(name);
                    return (
                      <button
                        key={name}
                        onClick={() => void toggle(name)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isSeen
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-charcoal border-card-border hover:bg-cream"
                        }`}
                      >
                        {isSeen && <Check className="w-3 h-3" />}
                        {name}
                      </button>
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
