"use client";

interface FilterTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
