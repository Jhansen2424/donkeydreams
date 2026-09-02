"use client";

import { Heart, Users, Sparkles, Sun, Baby } from "lucide-react";
import { useAnimals } from "@/lib/animals-context";

// Every tile computes LIVE from the roster (DB overlay included), so badge
// edits, birthdays, and added/removed donkeys all update the numbers without
// waiting for a spreadsheet re-import. Each tile carries a `derivation`
// string shown on hover so staff can spot-check the math.
export default function SanctuaryStats() {
  const { animals } = useAnimals();

  const items = [
    {
      label: "Total Donkeys",
      value: animals.length,
      icon: Heart,
      cls: "text-rose-600 bg-rose-50",
      derivation: "Count of donkeys in the roster.",
    },
    {
      label: "Mom + Baby",
      value: animals.reduce((sum, a) => sum + (a.momBabyCount ?? 0), 0),
      icon: Users,
      cls: "text-pink-600 bg-pink-50",
      derivation: "Sum of every donkey's 'Mom of N' count.",
    },
    {
      label: "Bonded Pairs",
      value: Math.round(animals.filter((a) => a.isBondedPair).length / 2),
      icon: Heart,
      cls: "text-purple-600 bg-purple-50",
      derivation:
        "Half the count of donkeys flagged as part of a bonded pair.",
    },
    {
      label: "Special Needs",
      value: animals.filter((a) => a.isSpecialNeedsFlag).length,
      icon: Sparkles,
      cls: "text-red-600 bg-red-50",
      derivation: "Count of donkeys with the Special Needs badge.",
    },
    {
      label: "Seniors (20+)",
      value: animals.filter((a) => a.isOver20).length,
      icon: Sun,
      cls: "text-amber-600 bg-amber-50",
      derivation:
        "Donkeys 20 or older, computed from birth dates (updates on birthdays).",
    },
    {
      label: "Under 3 yrs",
      value: animals.filter((a) => a.isUnder3).length,
      icon: Baby,
      cls: "text-sky-600 bg-sky-50",
      derivation:
        "Donkeys younger than 3, computed from birth dates (updates on birthdays).",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-card-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-charcoal">Sanctuary At a Glance</h3>
        <span className="text-[11px] text-warm-gray/60">From adoption records</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              title={item.derivation}
              className="flex items-center gap-2.5 cursor-help"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.cls}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-charcoal leading-tight">
                  {item.value}
                </p>
                <p className="text-[10px] text-warm-gray uppercase tracking-wider truncate">
                  {item.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
