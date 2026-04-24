"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Stethoscope,
  ClipboardCheck,
  Footprints,
  Weight,
  Users,
  DollarSign,
  CalendarDays,
  BarChart3,
  Settings,
  UtensilsCrossed,
  AlertTriangle,
  Inbox,
  Sparkles,
} from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";
import { useMedical } from "@/lib/medical-context";
import { useSchedule } from "@/lib/schedule-context";
import { useToast } from "@/lib/toast-context";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/app", icon: LayoutDashboard },
      { name: "Animals", href: "/app/animals", icon: Heart },
      { name: "Notes", href: "/app/notes", icon: Inbox, dynamicBadge: "notes" as const },
      { name: "Watch List", href: "/app/watch", icon: AlertTriangle },
      { name: "Sanctuary Updates", href: "/app/updates", icon: Sparkles },
    ],
  },
  {
    label: "Care",
    items: [
      { name: "Medical Entries", href: "/app/medical", icon: Stethoscope },
      { name: "Daily Routine", href: "/app/tasks", icon: ClipboardCheck },
      { name: "Feed Buckets", href: "/app/feed", icon: UtensilsCrossed },
      { name: "Hoof Care", href: "/app/hoof-dental?tab=hoof", icon: Footprints },
      { name: "Dental Care", href: "/app/hoof-dental?tab=dental", icon: Footprints },
      { name: "Weight Tracking", href: "/app/weight", icon: Weight },
    ],
  },
  {
    label: "Operations",
    items: [

      { name: "Admin", href: "/app/admin", icon: Users },
      { name: "Donations", href: "/app/donations", icon: DollarSign },
      { name: "Events / Visitors / Schedule", href: "/app/events", icon: CalendarDays },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Impact Report", href: "/app/reports", icon: BarChart3 },
      { name: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

// Maps sidebar item href → target EntryType when a note is dropped on it.
// Only items that correspond to a real category show drop-target styling.
// Missing entries (Dashboard, Reports, Admin, etc.) are not drop targets.
const NAV_DROP_TARGETS: Record<string, EntryType | "task-promote" | "medical-promote"> = {
  "/app/notes": "note",
  "/app/watch": "watch",
  "/app/medical": "medical-promote",
  "/app/tasks": "task-promote",
  "/app/feed": "feed",
};

export default function Sidebar() {
  const pathname = usePathname();
  const {
    unresolvedCount,
    entries,
    updateEntry,
    resolveEntry,
  } = useParkingLot();
  const { addEntry: addMedicalEntry } = useMedical();
  const { addTask } = useSchedule();
  const { toastSuccess, toastError } = useToast();
  const [dragOverHref, setDragOverHref] = useState<string | null>(null);

  const resolveBadge = (item: (typeof navGroups)[number]["items"][number]): number | undefined => {
    if ("dynamicBadge" in item && item.dynamicBadge === "notes") {
      return unresolvedCount > 0 ? unresolvedCount : undefined;
    }
    if ("badge" in item && typeof item.badge === "number") return item.badge;
    return undefined;
  };

  // Handle a note being dropped onto a sidebar item. The note id is read
  // from the drag event's dataTransfer (set by the draggable note cards on
  // /app/notes). For "medical-promote" and "task-promote" we move the note
  // into its new home (real MedicalEntry / real ScheduleTask) and resolve
  // the parking-lot entry. For plain category swaps (watch/feed/note) we
  // just re-tag the entry.
  const handleDrop = async (hrefPath: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverHref(null);
    const noteId = e.dataTransfer.getData("text/x-note-id");
    if (!noteId) return;
    const target = NAV_DROP_TARGETS[hrefPath];
    if (!target) return;
    const entry = entries.find((x) => x.id === noteId);
    if (!entry) return;

    if (target === "task-promote") {
      addTask({
        task: entry.text,
        assignedTo: entry.data?.assignee,
        animalSpecific: entry.data?.animal,
        category: "routine",
      });
      await resolveEntry(noteId);
      toastSuccess("Promoted note to today's schedule.");
      return;
    }
    if (target === "medical-promote") {
      if (!entry.data?.animal) {
        await updateEntry(noteId, { type: "medical" });
        toastError(
          "Tagged as medical, but no animal is attached — couldn't promote to a real medical entry. Edit the note to add an animal."
        );
        return;
      }
      await addMedicalEntry({
        animal: entry.data.animal,
        type: "Vet Visit",
        title: entry.data.title?.trim() || entry.text.slice(0, 60),
        date: entry.data.date ?? new Date().toISOString().split("T")[0],
        description: entry.text,
        urgent: false,
      });
      await resolveEntry(noteId);
      toastSuccess(`Moved note to ${entry.data.animal}'s medical record.`);
      return;
    }
    // Plain category swap (watch, feed, note): re-tag.
    if (target === entry.type) return;
    await updateEntry(noteId, { type: target });
    toastSuccess(`Recategorized note as ${target}.`);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-cream min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/app" className="block">
          <h1 className="text-xl font-bold text-white leading-tight">
            Donkey <span className="text-sand">Dreams</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50 mt-0.5">
            Sanctuary Manager
          </p>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/40 mb-2">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const hrefPath = item.href.split("?")[0];
                const isActive =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(hrefPath);
                const Icon = item.icon;
                const badge = resolveBadge(item);
                const isDropTarget = hrefPath in NAV_DROP_TARGETS;
                const isDragOver = dragOverHref === hrefPath;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onDragOver={(e) => {
                        if (!isDropTarget) return;
                        // Only show the hover style if the drag actually has
                        // a note id on it — otherwise any OS-level drag would
                        // trigger the styling.
                        const hasNote = e.dataTransfer.types.includes(
                          "text/x-note-id"
                        );
                        if (!hasNote) return;
                        e.preventDefault(); // required to allow drop
                        setDragOverHref(hrefPath);
                      }}
                      onDragLeave={() => {
                        if (dragOverHref === hrefPath) setDragOverHref(null);
                      }}
                      onDrop={(e) => {
                        if (!isDropTarget) return;
                        void handleDrop(hrefPath, e);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isDragOver
                          ? "bg-sand text-sidebar ring-2 ring-sand"
                          : isActive
                            ? "bg-sidebar-dark text-white"
                            : "text-cream/70 hover:bg-sidebar-light hover:text-white"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {badge !== undefined && (
                        <span className="bg-sand text-sidebar text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
