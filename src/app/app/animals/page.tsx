"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import FilterTabs from "@/components/app/FilterTabs";
import AnimalGridCard from "@/components/app/AnimalGridCard";
import AnimalTableRow from "@/components/app/AnimalTableRow";
import { animals, herds, type Animal } from "@/lib/animals";

const filterTabs = [
  "All Animals",
  "Special Needs",
  "Senior",
  "Sponsor Available",
  ...herds,
];

const tableHeaders = [
  "Name",
  "Age",
  "Sex",
  "Origin",
  "Herd",
  "Pen",
  "Status",
  "Tags",
  "",
];

export default function AnimalsPage() {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [activeFilter, setActiveFilter] = useState("All Animals");
  const [search, setSearch] = useState("");
  // Default every herd to collapsed — the user has to tap a herd header
  // to expand its list.
  const [collapsedHerds, setCollapsedHerds] = useState<Set<string>>(
    () => new Set(herds)
  );

  // We always group by herd so the herd headers stay visible (and clickable)
  // even when a herd filter or search is active. That makes "tap to open"
  // work consistently.
  const groupByHerd = true;

  // Auto-expand the matching herd when the user clicks a herd filter tab.
  useEffect(() => {
    if ((herds as readonly string[]).includes(activeFilter)) {
      setCollapsedHerds((prev) => {
        if (!prev.has(activeFilter)) return prev;
        const next = new Set(prev);
        next.delete(activeFilter);
        return next;
      });
    }
  }, [activeFilter]);

  const filtered = animals.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.herd.toLowerCase().includes(q) ||
      a.traits.some((t) => t.toLowerCase().includes(q)) ||
      a.bestFriends.some((f) => f.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (activeFilter === "All Animals") return true;
    if (activeFilter === "Special Needs")
      return a.tags.some((t) => t.label === "Special Needs");
    if (activeFilter === "Senior")
      return a.tags.some((t) => t.label === "Senior Care");
    if (activeFilter === "Sponsor Available") return a.sponsorable;
    // Herd filter
    return a.herd === activeFilter;
  });

  const toggleHerd = (herd: string) => {
    setCollapsedHerds((prev) => {
      const next = new Set(prev);
      if (next.has(herd)) next.delete(herd);
      else next.add(herd);
      return next;
    });
  };

  const goToAnimal = (animal: Animal) => {
    router.push(`/app/animals/${animal.slug}`);
  };

  // Group by herd for display. When a herd filter or a search with a match
  // in that herd narrows results, we still render the herd header so the
  // user can expand it.
  const grouped = herds
    .map((herd) => ({
      herd,
      animals: filtered.filter((a) => a.herd === herd),
    }))
    .filter((g) => g.animals.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Animals</h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {animals.length} donkeys · {filtered.length} shown
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors self-start">
          <Plus className="w-4 h-4" />
          New Animal
        </button>
      </div>

      {/* Filters + search + view toggle */}
      <div className="space-y-3">
        {/* Filter tabs - scrollable */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <FilterTabs
            tabs={filterTabs}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
            <input
              type="text"
              placeholder="Search name, herd, trait..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          {/* View toggle */}
          <div className="flex items-center bg-white border border-card-border rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setView("grid")}
              className={`p-2 transition-colors ${
                view === "grid"
                  ? "bg-sidebar text-white"
                  : "text-warm-gray hover:text-charcoal"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-2 transition-colors ${
                view === "table"
                  ? "bg-sidebar text-white"
                  : "text-warm-gray hover:text-charcoal"
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🫏</p>
          <p className="text-warm-gray font-medium">No donkeys found</p>
          <p className="text-sm text-warm-gray/60 mt-1">
            Try a different search or filter
          </p>
        </div>
      ) : view === "grid" ? (
        /* ── Grid View ── */
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.herd}>
              {/* Herd header (only when grouped) */}
              {groupByHerd && (
                <button
                  onClick={() => toggleHerd(group.herd)}
                  className="flex items-center gap-2 mb-4 group cursor-pointer"
                >
                  {collapsedHerds.has(group.herd) ? (
                    <ChevronRight className="w-5 h-5 text-warm-gray" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-warm-gray" />
                  )}
                  <h2 className="text-lg font-bold text-charcoal">
                    {group.herd}
                  </h2>
                  <span className="text-sm text-warm-gray font-normal">
                    ({group.animals.length})
                  </span>
                </button>
              )}

              {!collapsedHerds.has(group.herd) && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.animals.map((animal) => (
                    <div
                      key={animal.slug}
                      onClick={() => goToAnimal(animal)}
                      className="cursor-pointer"
                    >
                      <AnimalGridCard
                        {...animal}
                        onEdit={() => goToAnimal(animal)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.herd}>
              {/* Herd header */}
              {groupByHerd && (
                <button
                  onClick={() => toggleHerd(group.herd)}
                  className="flex items-center gap-2 mb-3 cursor-pointer"
                >
                  {collapsedHerds.has(group.herd) ? (
                    <ChevronRight className="w-5 h-5 text-warm-gray" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-warm-gray" />
                  )}
                  <h2 className="text-lg font-bold text-charcoal">
                    {group.herd}
                  </h2>
                  <span className="text-sm text-warm-gray font-normal">
                    ({group.animals.length})
                  </span>
                </button>
              )}

              {!collapsedHerds.has(group.herd) && (
                <div className="bg-white rounded-xl border border-card-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-card-border bg-cream/50">
                        {tableHeaders.map((h) => (
                          <th
                            key={h}
                            className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-warm-gray"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.animals.map((animal) => (
                        <AnimalTableRow
                          key={animal.slug}
                          {...animal}
                          onEdit={() => goToAnimal(animal)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
