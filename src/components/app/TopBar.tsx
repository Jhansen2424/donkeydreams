"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { format } from "date-fns";
import QuickInput from "@/components/app/QuickInput";
import { useParkingLot } from "@/lib/parking-lot-context";

export default function TopBar() {
  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good morning"
      : today.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  const [quickInputOpen, setQuickInputOpen] = useState(false);
  const { unresolvedCount } = useParkingLot();

  return (
    <>
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
            <button
              onClick={() => setQuickInputOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
            >
              <Mic className="w-4 h-4" />
              Quick Input
              {unresolvedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unresolvedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Quick Input Modal */}
      <QuickInput open={quickInputOpen} onClose={() => setQuickInputOpen(false)} />

      {/* Mobile floating action button */}
      <button
        onClick={() => setQuickInputOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-sidebar text-white rounded-full shadow-lg flex items-center justify-center hover:bg-sidebar-light transition-colors active:scale-95"
        aria-label="Quick Input"
      >
        <Mic className="w-6 h-6" />
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unresolvedCount}
          </span>
        )}
      </button>
    </>
  );
}
