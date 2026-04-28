"use client";

import { Heart, Users, Sparkles, Sun, IdCard } from "lucide-react";
import { sanctuaryStats } from "@/lib/donkey-profiles-data";

// Each tile carries a `derivation` string — when the user hovers, they see
// exactly how the number is computed. Lets staff spot-check against their
// own records without having to read the parser source.
const items = [
  {
    label: "Total Donkeys",
    value: sanctuaryStats.totalDonkeys,
    icon: Heart,
    cls: "text-rose-600 bg-rose-50",
    derivation: "Count of donkey rows in donkey-adoption.csv.",
  },
  {
    label: "Mom + Baby",
    value: sanctuaryStats.momBaby,
    icon: Users,
    cls: "text-pink-600 bg-pink-50",
    derivation:
      "Total unique children mentioned across all 'Mom of X' / 'Mother of X' / 'Father of X' notes in the adoption CSV.",
  },
  {
    label: "Bonded Pairs",
    value: sanctuaryStats.bondedPairs,
    icon: Heart,
    cls: "text-purple-600 bg-purple-50",
    derivation:
      "Half the count of donkeys whose Notes mention 'bonded with', 'buddies with', or 'close with'. Counts pairs, not individuals.",
  },
  {
    label: "Special Needs",
    value: sanctuaryStats.specialNeeds,
    icon: Sparkles,
    cls: "text-red-600 bg-red-50",
    derivation:
      "Count of donkeys whose Special Needs column in the adoption CSV is non-empty.",
  },
  {
    label: "Seniors (20+)",
    value: sanctuaryStats.seniors,
    icon: Sun,
    cls: "text-amber-600 bg-amber-50",
    derivation:
      "Count of donkeys whose Birth Date makes them 20 or older (computed against today).",
  },
  {
    label: "Need Microchip",
    value: sanctuaryStats.needsChip,
    icon: IdCard,
    cls: "text-orange-600 bg-orange-50",
    derivation:
      "Count of donkeys whose Avid # column in the adoption CSV is blank or non-numeric.",
  },
];

export default function SanctuaryStats() {
  return (
    <div className="bg-white rounded-xl border border-card-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-charcoal">Sanctuary At a Glance</h3>
        <span className="text-[11px] text-warm-gray/60">From adoption records</span>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
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
