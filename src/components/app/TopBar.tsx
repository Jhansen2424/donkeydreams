"use client";

import { Plus, StickyNote } from "lucide-react";
import { format } from "date-fns";

export default function TopBar() {
  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good morning"
      : today.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <header className="bg-white border-b border-card-border px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-charcoal">
            {greeting} 👋
          </h2>
          <p className="text-warm-gray text-sm mt-0.5">
            {format(today, "EEEE, MMMM d, yyyy")} · Scenic, AZ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors">
            <StickyNote className="w-4 h-4" />
            Add Note
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors">
            <Plus className="w-4 h-4" />
            New Animal
          </button>
        </div>
      </div>
    </header>
  );
}
