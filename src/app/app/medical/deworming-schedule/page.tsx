"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Calendar, Pill, ChevronDown, ChevronRight } from "lucide-react";
import { animals } from "@/lib/animals";
import { allMedicalEntries } from "@/lib/medical-data";
import { useMedical } from "@/lib/medical-context";

// ── Rotation schedule (from PREV-HERD-1..6 template in CSV) ──
// Every ~60 days, drugs rotate in this order
const ROTATION = [
  {
    drug: "Pyrantel Pamoate",
    dose: "Single Dose (6.6 mg/kg)",
    mgPerKg: 6.6,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    drug: "Moxidectin",
    dose: "Single Dose (0.2 mg/kg)",
    mgPerKg: 0.2,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    drug: "Fenbendazole",
    dose: "5-day Power Pack (5 mg/kg/day × 5)",
    mgPerKg: 5,
    days: 5,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    drug: "Ivermectin",
    dose: "Single Dose (0.2 mg/kg)",
    mgPerKg: 0.2,
    color: "bg-sky-100 text-sky-700 border-sky-200",
  },
] as const;

const ROTATION_INTERVAL_DAYS = 60;

const LB_TO_KG = 0.453592;

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function rotationIndexFromTitle(title: string): number {
  const t = title.toLowerCase();
  if (t.includes("pyrantel")) return 0;
  if (t.includes("moxidectin")) return 1;
  if (t.includes("fenbendazole")) return 2;
  if (t.includes("ivermectin")) return 3;
  return -1;
}

type HerdRow = {
  name: string;
  animals: number;
  lastDose: { drug: string; date: string; rotIdx: number } | null;
  nextDose: { drug: string; date: string; rotIdx: number } | null;
};

export default function DewormingSchedulePage() {
  const { entries: dbEntries } = useMedical();

  // ── Per-herd last dose + next dose ──
  const herds = useMemo<HerdRow[]>(() => {
    const byHerd = new Map<
      string,
      {
        animals: number;
        lastDose: { drug: string; date: string; rotIdx: number } | null;
      }
    >();

    for (const animal of animals) {
      if (!byHerd.has(animal.herd)) {
        byHerd.set(animal.herd, { animals: 0, lastDose: null });
      }
      byHerd.get(animal.herd)!.animals++;
    }

    // Merge DB entries with CSV seed; dedupe on id so optimistic echoes don't
    // double. DB entries come first so they win if the rare id collision occurs.
    const seen = new Set<string>();
    const combined = [...dbEntries, ...allMedicalEntries].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    const dewormings = combined
      .filter((e) => e.type === "Deworming")
      .sort((a, b) => (b.date > a.date ? 1 : -1));

    for (const entry of dewormings) {
      const animal = animals.find((a) => a.name === entry.animal);
      if (!animal) continue;
      const h = byHerd.get(animal.herd);
      if (!h || h.lastDose) continue;
      const rotIdx = rotationIndexFromTitle(entry.title);
      if (rotIdx === -1) continue;
      h.lastDose = { drug: ROTATION[rotIdx].drug, date: entry.date, rotIdx };
    }

    return Array.from(byHerd.entries())
      .map(([name, data]) => {
        let nextDose: { drug: string; date: string; rotIdx: number } | null = null;
        if (data.lastDose) {
          const nextIdx = (data.lastDose.rotIdx + 1) % ROTATION.length;
          nextDose = {
            drug: ROTATION[nextIdx].drug,
            date: addDays(data.lastDose.date, ROTATION_INTERVAL_DAYS),
            rotIdx: nextIdx,
          };
        }
        return { name, ...data, nextDose };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dbEntries]);

  // ── Dosage calculator ──
  const [weightLbs, setWeightLbs] = useState(400);
  const weightKg = weightLbs * LB_TO_KG;

  // ── Herd expand state — click a row to see the donkeys in that herd ──
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleHerd = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        href="/app/medical"
        className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Medical Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal flex items-center gap-3">
          <Pill className="w-7 h-7 text-orange-600" />
          Herd Deworming Schedule
        </h1>
        <p className="text-warm-gray mt-1">
          4-drug rotation on a {ROTATION_INTERVAL_DAYS}-day cycle. Tracks the
          next scheduled dose per herd.
        </p>
      </div>

      {/* Rotation overview */}
      <section className="bg-white rounded-xl border border-card-border p-5">
        <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-warm-gray/60" />
          Rotation
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ROTATION.map((r, i) => (
            <div key={r.drug} className={`rounded-xl border p-4 ${r.color}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Step {i + 1}
              </p>
              <p className="font-bold text-base mt-1">{r.drug}</p>
              <p className="text-xs mt-1 opacity-90">{r.dose}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-herd schedule — click to expand the list of individual donkeys;
          each donkey links to its detail page so the user can edit records. */}
      <section className="bg-white rounded-xl border border-card-border p-5">
        <h2 className="font-bold text-charcoal mb-1">Schedule by Herd</h2>
        <p className="text-xs text-warm-gray mb-4">
          Tap a herd to see the individuals — each links to that donkey&apos;s page.
        </p>
        <div className="space-y-3">
          {herds.map((h) => {
            const herdAnimals = animals
              .filter((a) => a.herd === h.name)
              .sort((a, b) => a.name.localeCompare(b.name));
            const isOpen = expanded.has(h.name);
            return (
              <div key={h.name} className="border border-card-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHerd(h.name)}
                  className="w-full text-left p-4 grid md:grid-cols-[auto_1fr_1fr_1fr] gap-4 items-center hover:bg-cream/40 transition-colors"
                >
                  <span className="text-warm-gray/60">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <div>
                    <p className="font-bold text-charcoal">{h.name}</p>
                    <p className="text-xs text-warm-gray">{h.animals} animals</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-warm-gray/60">
                      Last Dose
                    </p>
                    {h.lastDose ? (
                      <>
                        <p className="text-sm font-semibold text-charcoal">{h.lastDose.drug}</p>
                        <p className="text-xs text-warm-gray">{formatDate(h.lastDose.date)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-warm-gray/60">No history</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-warm-gray/60">
                      Next Dose
                    </p>
                    {h.nextDose ? (
                      <>
                        <p className="text-sm font-semibold text-charcoal">{h.nextDose.drug}</p>
                        <p className="text-xs text-warm-gray">Due {formatDate(h.nextDose.date)}</p>
                      </>
                    ) : (
                      <p className="text-sm text-warm-gray/60">—</p>
                    )}
                  </div>
                </button>
                {isOpen && herdAnimals.length > 0 && (
                  <div className="bg-cream/30 border-t border-card-border px-4 py-3">
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {herdAnimals.map((a) => (
                        <li key={a.slug}>
                          <Link
                            href={`/app/animals/${a.slug}`}
                            className="block px-3 py-2 bg-white rounded-lg border border-card-border text-sm text-charcoal hover:bg-sidebar hover:text-white hover:border-sidebar transition-colors"
                          >
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Dosage calculator */}
      <section className="bg-white rounded-xl border border-card-border p-5">
        <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-warm-gray/60" />
          Dosage Calculator
        </h2>

        <div className="flex items-end gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Weight (lbs)
            </label>
            <input
              type="number"
              value={weightLbs}
              onChange={(e) => setWeightLbs(Number(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              min={0}
            />
          </div>
          <p className="text-sm text-warm-gray pb-2">
            = <span className="font-semibold text-charcoal">{weightKg.toFixed(1)} kg</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROTATION.map((r) => {
            const totalMg = r.mgPerKg * weightKg;
            const days = "days" in r ? r.days : 1;
            const totalCourse = totalMg * days;
            return (
              <div key={r.drug} className="border border-card-border rounded-xl p-4">
                <p className="font-bold text-charcoal text-sm">{r.drug}</p>
                <p className="text-xs text-warm-gray mb-2">{r.dose}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-charcoal">
                    {totalMg.toFixed(0)}
                  </span>
                  <span className="text-xs text-warm-gray">mg/day</span>
                </div>
                {days > 1 && (
                  <p className="text-xs text-warm-gray mt-1">
                    Total course: <span className="font-semibold">{totalCourse.toFixed(0)} mg</span> over {days} days
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-warm-gray/60 mt-4">
          ⚠ Always verify dosages with your veterinarian. This is a reference
          calculator, not medical advice.
        </p>
      </section>
    </div>
  );
}
