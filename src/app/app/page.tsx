"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, AlertTriangle, ClipboardCheck, Users } from "lucide-react";
import StatCard from "@/components/app/StatCard";
import AnimalCard from "@/components/app/AnimalCard";
import FilterTabs from "@/components/app/FilterTabs";
import MedicalTimeline from "@/components/app/MedicalTimeline";
import WatchList from "@/components/app/WatchList";
import {
  animals,
  getSpecialNeedsAnimals,
  getCareAlerts,
  getTodayTaskStats,
  upcomingMedical,
} from "@/lib/animals";

const specialNeeds = getSpecialNeedsAnimals();
const careAlerts = getCareAlerts();
const taskStats = getTodayTaskStats();

// Show a subset of animals on dashboard (ones with the most data)
const dashboardAnimals = animals
  .filter((a) => a.traits.length > 0)
  .slice(0, 8);

const filterTabs = ["All", "Special Needs", "Senior", "Sponsor Available"];

export default function AppDashboard() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = dashboardAnimals.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "All") return true;
    if (activeFilter === "Special Needs") return a.status === "Special Needs";
    if (activeFilter === "Senior")
      return a.tags.some((t) => t.label === "Senior Care");
    if (activeFilter === "Sponsor Available") return a.sponsorable;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Animals"
          value={animals.length}
          subtitle={`9 herds across property`}
          icon={Heart}
        />
        <StatCard
          label="Special Needs"
          value={specialNeeds.length}
          subtitle={specialNeeds.map((a) => a.name).join(", ")}
          icon={Users}
        />
        <StatCard
          label="Care Alerts"
          value={careAlerts}
          subtitle="Need attention this month"
          icon={AlertTriangle}
          highlight
        />
        <StatCard
          label="Tasks Today"
          value={`${taskStats.completed}/${taskStats.total}`}
          subtitle={`${Math.round((taskStats.completed / taskStats.total) * 100)}% complete`}
          icon={ClipboardCheck}
        />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <FilterTabs
          tabs={filterTabs}
          active={activeFilter}
          onChange={setActiveFilter}
        />
        <input
          type="text"
          placeholder="Search animals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56 px-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
        />
      </div>

      {/* Animal grid + medical timeline */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {filtered.map((animal) => (
            <div
              key={animal.slug}
              onClick={() => router.push(`/app/animals/${animal.slug}`)}
              className="cursor-pointer"
            >
              <AnimalCard
                name={animal.name}
                age={`${animal.age} ${animal.sex}`}
                sex={animal.sex}
                origin={animal.origin}
                tags={animal.tags}
                tasks={animal.tasks.slice(0, 3).map((t) => t.title)}
                taskProgress={`${Math.round(animal.tasks.length * 0.42)}/${animal.tasks.length} tasks complete today`}
                heartColor={
                  animal.status === "Special Needs"
                    ? "text-red-400"
                    : animal.tags.some((t) => t.label === "Senior Care")
                      ? "text-amber-500"
                      : "text-terra"
                }
              />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <WatchList />
          <MedicalTimeline events={upcomingMedical} />
        </div>
      </div>

      {/* View all link */}
      <div className="text-center">
        <button
          onClick={() => router.push("/app/animals")}
          className="text-sm font-medium text-sky hover:text-sky-dark transition-colors"
        >
          View all {animals.length} animals →
        </button>
      </div>
    </div>
  );
}
