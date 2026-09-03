"use client";

interface FilterTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    // Phones: ONE swipeable row (the wall of wrapped pills ate half the
    // screen). Desktop: wrap as before. Parents provide overflow-x-auto.
    <div className="flex flex-nowrap w-max sm:w-auto sm:flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            active === tab
              ? "bg-sidebar text-white"
              : "bg-white border border-card-border text-charcoal hover:bg-cream"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
